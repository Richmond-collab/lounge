import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ImagePlus, MessageCircle, Mic, MicOff, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/groups/$slug")({
  head: () => ({
    meta: [
      { title: "Group — CAC" },
      { name: "description", content: "Group discussions and fellowship." },
      { property: "og:title", content: "Group — CAC" },
      { property: "og:description", content: "Group discussions and fellowship." },
    ],
  }),
  component: GroupPage,
});

interface GroupMessage {
  id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  image_path: string | null;
  audio_path: string | null;
  profiles: { display_name: string } | null;
  comments: { id: string }[];
}

function MessageBubble({ message, currentUserId }: { message: GroupMessage; currentUserId: string }) {
  const isMine = message.user_id === currentUserId;
  const { data: imageUrl } = useQuery({
    queryKey: ["group-message-image", message.id],
    enabled: !!message.image_path,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("group-attachments").createSignedUrl(message.image_path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  const { data: audioUrl } = useQuery({
    queryKey: ["group-message-audio", message.id],
    enabled: !!message.audio_path,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("group-attachments").createSignedUrl(message.audio_path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[88%] break-words rounded-2xl px-3 py-2 shadow-sm sm:max-w-[75%] ${
          isMine ? "rounded-br-sm bg-emerald-100 text-foreground dark:bg-emerald-950" : "rounded-bl-sm bg-card"
        }`}
      >
        {!isMine && <p className="mb-1 text-xs font-semibold text-primary">{message.profiles?.display_name ?? "Member"}</p>}
        {message.title && message.title !== message.body && <p className="font-semibold">{message.title}</p>}
        {message.body && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.body}</p>}
        {imageUrl && <img src={imageUrl} alt="Shared in the group" className="mt-2 max-h-80 w-full rounded-xl object-cover" />}
        {audioUrl && <audio controls src={audioUrl} className="mt-2 w-full" />}
        <div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${isMine ? "text-muted-foreground" : "text-muted-foreground"}`}>
          <Link to="/posts/$id" params={{ id: message.id }} className="inline-flex items-center gap-1 hover:underline">
            <MessageCircle className="h-3 w-3" /> {message.comments.length || "Reply"}
          </Link>
          <time dateTime={message.created_at}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </time>
        </div>
      </article>
    </div>
  );
}

function GroupPage() {
  const { slug } = Route.useParams();
  const me = useMe();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedAudioUrlRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: group, isLoading: isGroupLoading, error: groupError } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*, group_members(user_id)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const groupId = group?.id;
  const joined = !!group?.group_members.some((m) => m.user_id === me.id);
  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery({
    queryKey: ["posts", groupId],
    enabled: !!groupId && joined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(display_name), comments(id)")
        .eq("group_id", group!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stream.getTracks().forEach((track) => track.stop());
        recorder.stop();
      }
      if (recordedAudioUrlRef.current) URL.revokeObjectURL(recordedAudioUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!groupId || !joined) return;
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: `group_id=eq.${groupId}` },
        () => {
          void qc.invalidateQueries({ queryKey: ["posts", groupId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, joined, qc]);

  const lastPostId = posts[posts.length - 1]?.id;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts.length, lastPostId]);

  const membership = useMutation({
    mutationFn: async () => {
      const { error } = joined
        ? await supabase.from("group_members").delete().eq("group_id", group!.id).eq("user_id", me.id)
        : await supabase.from("group_members").insert({ group_id: group!.id, user_id: me.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(joined ? "You left the group" : "Welcome to the group!");
      qc.invalidateQueries({ queryKey: ["group", slug] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    let activeStream: MediaStream | null = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStream = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const format = recorder.mimeType || mimeType || "audio/webm";
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: format });
        stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingSeconds(0);
        timerRef.current = null;
        if (blob.size === 0) {
          toast.error("No audio was recorded");
          return;
        }
        const extension = format.includes("mp4") ? "m4a" : format.split("/")[1].split(";")[0];
        const url = URL.createObjectURL(blob);
        recordedAudioUrlRef.current = url;
        setRecordedAudioUrl(url);
        setAudioFile(new File([blob], `recording-${Date.now()}.${extension}`, { type: blob.type || format }));
        toast.success("Recording saved");
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        mediaRecorderRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        toast.error("Recording failed");
      };
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start();
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (error) {
      activeStream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      toast.error(error instanceof Error ? error.message : "Could not access the microphone");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const selectAudioFile = (file: File | null) => {
    if (recordedAudioUrlRef.current) URL.revokeObjectURL(recordedAudioUrlRef.current);
    recordedAudioUrlRef.current = null;
    setRecordedAudioUrl(null);
    setAudioFile(file);
  };

  const post = useMutation({
    mutationFn: async () => {
      let image_path: string | null = null;
      let audio_path: string | null = null;
      if (imageFile) {
        const path = `${group!.id}/${me.id}/${Date.now()}-${imageFile.name}`;
        const { error } = await supabase.storage.from("group-attachments").upload(path, imageFile);
        if (error) throw error;
        image_path = path;
      }
      if (audioFile) {
        const path = `${group!.id}/${me.id}/${Date.now()}-${audioFile.name}`;
        const { error } = await supabase.storage.from("group-attachments").upload(path, audioFile);
        if (error) throw error;
        audio_path = path;
      }
      const { error } = await supabase.from("posts").insert({
        group_id: group!.id,
        user_id: me.id,
        title: "",
        body: body.trim(),
        image_path,
        audio_path,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (recordedAudioUrlRef.current) URL.revokeObjectURL(recordedAudioUrlRef.current);
      recordedAudioUrlRef.current = null;
      setRecordedAudioUrl(null);
      setBody("");
      setImageFile(null);
      setAudioFile(null);
      toast.success("Message sent");
      qc.invalidateQueries({ queryKey: ["posts", groupId] });
    },
    onError: (error) => toast.error(error.message || "Couldn't post"),
  });

  const canSendMessage = Boolean(body.trim() || imageFile || audioFile);
  const sendMessage = () => {
    if (!canSendMessage || post.isPending || isRecording) return;
    post.mutate();
  };

  if (isGroupLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (groupError) return <div className="p-10 text-center text-destructive">Couldn't load this group: {groupError.message}</div>;
  if (!group) return <div className="p-10 text-center text-muted-foreground">Group not found.</div>;

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] w-full max-w-5xl flex-col overflow-hidden bg-muted/30 sm:my-3 sm:h-[calc(100dvh-7rem)] sm:rounded-2xl sm:border">
      <header className="flex shrink-0 items-center gap-3 bg-primary px-3 py-3 text-primary-foreground sm:px-5">
        <Link to="/groups" aria-label="Back to groups" className="rounded-full p-2 hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{group.name}</h1>
          <p className="truncate text-xs opacity-80">
            {group.group_members.length} members{group.description ? ` · ${group.description}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => membership.mutate()}
          disabled={membership.isPending}
          className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          {joined ? "Leave" : "Join"}
        </Button>
      </header>

      <main
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/40 px-3 py-4 sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {postsError && <p className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">Couldn't load messages: {postsError.message}</p>}
        {!joined && (
          <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-card p-5 text-center shadow-sm">
            <p className="font-medium">Join {group.name} to chat with the group.</p>
            <p className="mt-1 text-sm text-muted-foreground">Only group members can read and send messages.</p>
          </div>
        )}
        {joined && isPostsLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading messages…</p>}
        {joined && !isPostsLoading && !postsError && posts.length === 0 && (
          <p className="mx-auto mt-8 max-w-sm rounded-full bg-card px-4 py-2 text-center text-sm text-muted-foreground shadow-sm">
            This is the start of the conversation. Say hello!
          </p>
        )}
        {joined && posts.map((message) => <MessageBubble key={message.id} message={message} currentUserId={me.id} />)}
        <div ref={messagesEndRef} />
      </main>

      {joined && (
        <form
          aria-busy={post.isPending}
          className="shrink-0 border-t bg-background/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur sm:p-3"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          {(imageFile || audioFile) && (
            <div className="mx-auto mb-2 flex max-w-4xl flex-wrap items-center gap-2 text-xs">
              {imageFile && (
                <span className="flex max-w-full items-center gap-1 rounded-full bg-muted px-3 py-1">
                  <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-40 truncate">{imageFile.name}</span>
                  <button type="button" aria-label="Remove image" onClick={() => setImageFile(null)}><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {audioFile && (
                <span className="flex max-w-full items-center gap-1 rounded-full bg-muted px-3 py-1">
                  <Mic className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-40 truncate">{audioFile.name}</span>
                  <button type="button" aria-label="Remove audio" onClick={() => selectAudioFile(null)}><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {recordedAudioUrl && <audio src={recordedAudioUrl} controls className="h-9 max-w-full" />}
            </div>
          )}
          <div className="mx-auto flex max-w-4xl items-end gap-1.5 sm:gap-2">
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Attach an image" title="Attach an image">
              <ImagePlus className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  setImageFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Attach audio" title="Attach audio">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(event) => {
                  selectAudioFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "ghost"}
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={post.isPending}
              aria-label={isRecording ? `Stop recording at ${recordingSeconds} seconds` : "Record a voice message"}
              title={isRecording ? "Stop recording" : "Record a voice message"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            {isRecording && <span className="shrink-0 pb-2 text-xs text-destructive">{recordingSeconds}s</span>}
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              maxLength={4000}
              rows={1}
              placeholder="Message"
              aria-label="Message"
              className="min-h-11 max-h-28 min-w-0 flex-1 resize-y rounded-2xl bg-muted px-4 py-2.5"
            />
            <Button
              type="button"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full touch-manipulation"
              onClick={sendMessage}
              disabled={post.isPending || isRecording || !canSendMessage}
              aria-label="Send message"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {post.isError && <p className="mx-auto mt-1 max-w-4xl text-xs text-destructive">{post.error.message}</p>}
        </form>
      )}
    </div>
  );
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString(undefined, opts ?? { weekday: "short", month: "short", day: "numeric" });
}
export function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
export function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function initials(name?: string | null) {
  return (name ?? "M").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

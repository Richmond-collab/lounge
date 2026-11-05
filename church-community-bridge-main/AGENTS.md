<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All member screens live under `src/routes/_authenticated/` with the bottom tab bar in its layout — sign-in is required for every app feature.
- Member data is read/written from the browser Supabase client with RLS as the security boundary — keeps the app simple without server functions.
- Admin-only content (sermons, events, groups) is gated by `has_role(uid,'admin')` in RLS — roles live in `user_roles`, never in profile data.
- Announcements are readable by signed-in members and writable only by admins through `has_role` policies, keeping updates in a separate managed stream.
- Group photos and voice notes use private storage paths scoped to a group and uploader; short-lived signed URLs keep attachments available only to authenticated app members.
- PWA is manifest-only (no service worker) — installability without stale-cache risk.

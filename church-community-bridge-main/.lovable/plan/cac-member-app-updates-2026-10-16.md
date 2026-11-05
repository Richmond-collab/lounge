# CAC member app updates

## Plan
- Use the uploaded Christ Apostolic Church image as the app’s logo and update the app’s home and sign-in branding.
- Add optional group post photos and recorded voice notes, saved in private church storage and playable/viewable in discussions.
- Give admins event/activity create and edit controls, plus announcement publishing and management; members can read announcements, while database permissions keep management admin-only.
- Refresh the signed-in home screen with a calmer, more welcoming layout and a recent-announcements area.
- Verify the preview, relevant route metadata, and existing tests/build signals.

## Technical details
- Add optional media fields to group posts, a protected announcements table, and authenticated storage policies for group attachments.
- Keep authorization in the existing role system and database policies; hide admin controls for members as a usability layer, not a security boundary.
- Use browser audio recording and signed file access for private media; preserve the existing installable-app setup.

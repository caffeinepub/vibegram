# VibeGram

## Current State
- Full social media app with home feed, posts, reels, stories, messages, profile, settings
- Auth: @username + password login/signup (localStorage-based VGAccount)
- Edit Profile modal: displayName, bio, profile photo -- no social links or pronouns
- Messages/Chat: text messages, audio call, video call (simulated); no stickers/GIF/location in chat
- VideoCallSheet: simulated UI without real camera access
- Auth: only @username login; no email or phone number option
- No post-signup discovery/onboarding flow

## Requested Changes (Diff)

### Add
1. **Edit Profile -- Social Links**: Up to 3 social links (URL + label) stored in localStorage (`vg_profile_links_<username>`) and displayed on profile page below bio
2. **Edit Profile -- Pronouns**: Text field for pronouns (he/him, she/her, they/them, or custom), stored in localStorage (`vg_profile_pronouns_<username>`), shown below username on profile
3. **Chat Extras -- Sticker panel**: Tapping a sticker icon in chat input bar opens an emoji/sticker picker sheet; selected sticker sends as a message with a special `__sticker__<emoji>` prefix rendered large in the bubble
4. **Chat Extras -- GIF**: GIF button opens a sheet with a small curated list of animated GIF URLs (or placeholder GIF tiles); tapping one sends `__gif__<url>` rendered as an image
5. **Chat Extras -- Location**: Location button requests `navigator.geolocation`; if granted, sends a message formatted as `__location__<lat>,<lng>` rendered as a tappable map link
6. **Video Call -- Camera Permission**: On VideoCallSheet open, request `getUserMedia({video:true, audio:true})`; show live camera stream in self-preview box if granted, show permission denied UI if not
7. **Auth -- Email/Phone login**: Add a toggle on login page: "Username | Email | Phone" -- all three methods accept a password. For create account: add optional Email and Phone fields. Store email/phone in VGAccount. Find account by username OR email OR phone on login
8. **Discover People -- Post-signup onboarding**: After a new account is created (on `toast.success("Account created...")` path), navigate to a new `/discover` route showing suggested users to follow. User can tap Follow on 5+ accounts then tap "Done", or tap "Skip" to go directly to home

### Modify
- `AuthPage.tsx`: Add email/phone toggle for login; add email + phone fields to create account form; post-signup redirect to `/discover`
- `ProfilePage.tsx` (EditProfileModal): Add pronouns and 3 social link fields; display pronouns under @username and social links under bio
- `MessagesPage.tsx` (ChatView): Add sticker/GIF/location buttons next to text input; render special message types (sticker, gif, location) differently in MessageBubble
- `VideoCallSheet.tsx`: Add `getUserMedia` on open; show real camera stream in self-preview; handle permission denied gracefully

### Remove
- Nothing removed

## Implementation Plan
1. Update `AuthPage.tsx`:
   - Login: add tab switcher for Username / Email / Phone; adjust `findAccount` logic to search by email or phone too; VGAccount interface gets optional `email` and `phone` fields
   - Create Account: add optional Email and Phone fields; validate email format if provided; after successful signup call `navigate({ to: "/discover" })`
2. Add `DiscoverPeoplePage.tsx`:
   - Route at `/discover`
   - Show list of all other backend users with Follow buttons
   - Count followed; "Done" button enabled after ≥5 follows OR any time (with counter showing), "Skip" link always visible
   - Both navigate to `/`
3. Register `/discover` route in `App.tsx`
4. Update `ProfilePage.tsx` EditProfileModal:
   - Add `pronouns` string field (input with suggestions: he/him, she/her, they/them, or custom)
   - Add `socialLinks` array of up to 3 `{label, url}` objects
   - Save to localStorage keys `vg_profile_pronouns_<username>` and `vg_profile_links_<username>`
   - Display pronouns in grey under @username; display social links as clickable chips below bio
5. Update `VideoCallSheet.tsx`:
   - On open call `navigator.mediaDevices.getUserMedia({video:true,audio:true})`
   - Attach stream to a `<video>` element in self-preview box
   - Handle NotAllowedError with a "Camera permission denied" message and a "Allow Camera" retry button
   - Stop all tracks on close
6. Update `MessagesPage.tsx` ChatView:
   - Add icons row in input area: Sticker (smile icon), GIF (text icon), Location (map-pin icon)
   - Sticker: Sheet with emoji categories (Smileys, Hearts, Celebrations) -- tap sends `__sticker__<emoji>`
   - GIF: Sheet with 8 placeholder animated GIF tiles (via giphy public domain or placeholder URLs) -- tap sends `__gif__<url>`
   - Location: calls `navigator.geolocation.getCurrentPosition`, on success sends `__location__<lat>,<lng>`, on error shows toast
   - MessageBubble updated to render stickers (large emoji, no bubble background), GIFs (image tag), and location (map-pin link to maps.google.com)

# VibeGram

## Current State
VibeGram is a full Instagram-like social media app with:
- Auth: @username/email/phone login + signup (localStorage-based)
- Home feed with Stories bar, posts with like/comment/share/save
- StoryUploadSheet with CreativeToolbar (filters, stickers, text, music) and close-friends toggle
- CreativeToolbar: 8 filters, emoji stickers, @mention/#hashtag stickers, text styles, 40+ songs (genres: Pop/Hip-Hop/Bollywood/R&B/EDM)
- Explore page with user search, hashtag discovery, reels section, trending posts
- Messages with audio/video call, sticker/GIF/location send, Note feature
- Profile with highlights, social links (up to 3), pronouns
- Settings with all sections, dark mode, username change, close friends, etc.
- ReelsPage, LiveStreamSheet, MediaCreationHub
- No "Forgot Password" feature currently

## Requested Changes (Diff)

### Add
1. **Song Search in Story/Note/CreativeToolbar** -- Add a search input inside the Music tab of CreativeToolbar so users can type a song name or artist and only matching songs appear. Songs should play a short audio preview (simulated with a play/pause button) on tap, like Instagram.
2. **Song Search in Explore page** -- Add a "Music" search tab or section in ExplorePage where users can search songs by name/artist. Results show song cards; tapping plays a simulated preview.
3. **Social Link sticker in Story upload** -- In StoryUploadSheet and CreativeToolbar, add a "Link" sticker option in the stickers panel where user can type a URL and it gets added as a clickable link overlay on the story.
4. **New Instagram-style filters** -- Add more filters to FILTERS array in CreativeToolbar: Lux, Chrome, Inkwell, Clarendon, Gingham, Moon, Reyes, Juno, Slumber, Crema (total ~18 filters).
5. **Forgot Password flow** -- On login page (AuthPage), below the password field, add "Forgot password?" link. Clicking opens a modal/dialog: Step 1) shows the username pre-filled (read-only) + asks for email or phone to verify identity, Step 2) simulates OTP sent (shows 6-digit OTP input), Step 3) on correct OTP ("123456" accepted as valid for demo), shows "Create New Password" screen with new password + confirm. On success, updates the stored account password and shows success toast.
6. **Instagram-style Story creation screen (StoryUploadSheet revamp)** -- When user taps "Your story" / "+" in StoriesBar, instead of directly showing a file picker, show an Instagram-style creation screen with large option buttons: Camera (opens camera capture), Photo (file picker), Text (opens text creation mode), Song (opens music picker), Add Social Link (opens link input), Stickers (opens sticker picker). Each option has an icon + label in a grid/list layout.

### Modify
- **CreativeToolbar Music tab** -- Add search input at top to filter songs by title/artist in real time. Add play/pause preview icon next to each song row.
- **ExplorePage** -- Add a "Music" tab or section alongside existing content. When "Music" search is active, show song search results with play/pause controls.
- **StoryUploadSheet** -- Integrate Social Link overlay type: new "Link" sticker category in CreativeToolbar, adds a link overlay on canvas.
- **AuthPage** -- Add "Forgot password?" link below password on login form. Implement multi-step forgot password modal.

### Remove
- Nothing removed.

## Implementation Plan
1. **CreativeToolbar.tsx** -- Add search state + input in Music tab; filter ALL_SONGS by search; add play/pause button per row (simulated audio using Audio API with a dummy tone or just visual toggle). Add 10 new Instagram-style CSS filters. Add "Link" sticker category with URL input.
2. **StoryUploadSheet.tsx** -- Add "Social Link" overlay support (link sticker added to canvas). Show Instagram-style creation options screen before file selection (Camera, Photo, Text, Song, Social Link, Stickers options grid).
3. **MediaOverlayCanvas.tsx** -- Support "link" overlay type rendering as a blue pill with chain icon.
4. **ExplorePage.tsx** -- Add Music search section: search input, filtered song cards with play/pause toggle.
5. **AuthPage.tsx** -- Add "Forgot password?" button below password. Add ForgotPasswordModal component (3-step: verify identity → OTP → new password).

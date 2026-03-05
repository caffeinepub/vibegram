# VibeGram

## Current State

VibeGram is a full-stack social media app on the Internet Computer with:
- Auth (Internet Identity + profile registration)
- Home feed with Stories bar (24h stories, story viewer with emoji reactions, reply, views panel)
- Explore page (trending posts grid, user search, suggested users, reels horizontal scroll)
- Upload / Media Creation Hub (Post, Story, Reels, Live tabs)
- Reels vertical feed
- Profile page (tabs: Posts/Reels/Tagged/Saved, edit profile, settings link)
- User profile pages with follow/unfollow
- Notifications
- Messages (conversations)
- Settings (account, privacy, story privacy select, close friends list via localStorage, blocked users, dark/light mode, verification request, about/privacy/TOS, feedback)

Stories are stored as regular posts with `__story__` or `__cf__` caption prefixes.
Close friends list is stored in localStorage under `vg_close_friends` key.
The `AvatarWithRing` component renders gradient rings; a green ring for close friends is partially scaffolded in `StoryViewer` (checks `__cf__` prefix and shows a green ring & "CF" badge on author info).

## Requested Changes (Diff)

### Add
1. **Hashtag Discovery Page** (`/hashtags`) -- dedicated page for browsing and searching hashtags extracted from post captions, showing top hashtags with post counts and a post grid per hashtag.
2. **Close Friends Story Feature** -- full green-ring indicator on the StoriesBar for stories posted by users in the close friends list; green ring on `AvatarWithRing` when `isCloseFriend` prop is true; `StoryUploadSheet` close friends toggle so the story caption is prefixed `__cf__`; `StoriesBar` reads localStorage close friends list to apply correct ring color.

### Modify
- `StoriesBar.tsx` -- read `vg_close_friends` localStorage list, pass `isCloseFriend` flag to `StoryAvatarById` so it renders a green ring instead of gradient ring.
- `AvatarWithRing.tsx` -- accept optional `isCloseFriend` prop; when true, render a solid green OKLCH ring instead of gradient.
- `StoryUploadSheet.tsx` -- add a "Share with Close Friends only" toggle; when enabled, prepend `__cf__` to caption on submit.
- `App.tsx` -- add `/hashtags` route and `HashtagsPage` import.
- `ExplorePage.tsx` -- add a "Hashtags" chip/tab or button linking to `/hashtags`.
- `BottomNav.tsx` -- optionally surface a subtle hashtag link or keep nav as-is (no change to bottom nav icons required).

### Remove
- Nothing removed.

## Implementation Plan

1. Create `src/frontend/src/pages/HashtagsPage.tsx`:
   - Parse hashtags from all explore feed posts (regex `#\w+` on captions).
   - Build a map of `hashtag -> Post[]`.
   - Show a search input to filter hashtags.
   - Show top hashtags as pill chips with post count badges (sorted by count).
   - Clicking a hashtag shows a 2-column grid of posts that used it.
   - Back button returns to hashtag list.
   - Route: `/hashtags`.

2. Update `AvatarWithRing.tsx`:
   - Add `isCloseFriend?: boolean` prop.
   - When `isCloseFriend` is true, use OKLCH green ring (`oklch(0.55 0.2 150)`) instead of `gradient-bg`.

3. Update `StoriesBar.tsx`:
   - Read `vg_close_friends` from localStorage.
   - Pass `isCloseFriend` to `StoryAvatarById` based on whether the story author's username is in the close friends list.
   - `StoryAvatarById` fetches profile and forwards `isCloseFriend` to `StoryAvatar`.
   - `StoryAvatar` uses the new `AvatarWithRing` isCloseFriend prop for the ring color.

4. Update `StoryUploadSheet.tsx`:
   - Add a Switch toggle labeled "Close Friends only".
   - When enabled, prepend `__cf__` to the submitted caption so the story is identified as a close-friends story.

5. Register `/hashtags` route in `App.tsx`.

6. Add a "# Hashtags" link/button in `ExplorePage.tsx` header or as a section.

# VibeGram

## Current State

VibeGram is a working Instagram-like social media app with:
- Internet Identity auth + user registration
- Home feed (posts from followed users), Explore, Upload, Notifications, Profile, DMs, Saved pages
- Post creation (photo/video), likes, comments, follow/unfollow
- Stories bar with 24h story upload and viewer
- Save/bookmark posts
- Search users
- Bottom navigation bar
- Splash screen with purple-pink gradient
- Dark theme with OKLCH gradients

Backend supports: UserProfile, Post, Comment, Notification, Message types.
Components: authorization, blob-storage.

## Requested Changes (Diff)

### Add
- **App icon/logo**: Use uploaded VibeGram icon (InShot_20260306_023848346-1.png) on splash screen and as app favicon
- **Media Creation Hub**: Unified creation modal with tabs for Post, Story, Reels, Live — each opens dedicated editor
- **Reels system**: Dedicated Reels tab/page with vertical video scroll (swipe-up navigation), like/comment/share/follow on reels
- **Stories enhancements**: Story creative tools (text with font styles, stickers, emoji reactions panel, drawing tool, filters, location/hashtag/mention stickers, link sticker), story privacy settings (public/followers/close friends/hidden), close friends list with green ring
- **Story interactions**: Emoji reaction bar, reply input, views list in story viewer
- **Save/Bookmark** on posts: already partially present, ensure visible on all post cards
- **Share button**: Copy link to post, share sheet
- **Tagged posts**: Backend + UI for tagging users in posts, "Tagged" tab on profile
- **Collaboration posts**: Two-author posts appear on both profiles
- **Verification badge**: Blue checkmark badge on verified users, request verification in settings
- **Trending algorithm**: Trending section in Explore based on likes/comments/shares/engagement
- **Notification types**: Extend to mentions, tags, collab requests, live alerts
- **Safety tools**: Block/unblock users, report posts/accounts, hide comments, spam detection UI
- **Settings page**: Full settings with account, privacy, close friends, blocked users, dark/light mode toggle, Privacy Policy, Terms, Contact/Support, About VibeGram
- **Live streaming (simulated)**: Live broadcast start UI, viewer count, real-time emoji reactions, join with another user UI (frontend simulation since WebSockets not available)
- **Messaging enhancements**: Photo/video send in DMs, emoji picker, message status (sent/delivered/seen), block in chat
- **Close Friends**: Manage close friends list, green ring indicator on stories

### Modify
- Splash screen: incorporate uploaded app icon prominently
- Bottom nav: add Reels tab icon
- Upload modal: replace with full Media Creation Hub
- Home page: improve Stories bar with emoji reactions/reply, close friends green rings
- Profile page: add Tagged Posts tab, Saved tab, verification badge display
- Explore page: add Trending section with engagement-sorted content
- Notifications page: extended notification types
- Settings page: replace dropdown with full settings page

### Remove
- Old simple UploadModal (replaced by Media Creation Hub)

## Implementation Plan

1. **Backend**: Extend Motoko with:
   - Story type with privacy settings, views, reactions, close friends
   - Reel type (short video, separate from posts)
   - Extended notifications (mention, tag, collab, live)
   - Saved posts per user
   - Block list per user
   - Close friends list per user
   - Verification badge + request system
   - Trending score computation
   - Tagged posts (postId → [UserId])
   - Collab posts (two authors)
   - Report system

2. **Frontend**:
   - Update splash screen with uploaded app icon
   - Build MediaCreationHub component (Post/Story/Reels/Live tabs)
   - Build ReelsPage with vertical scroll feed
   - Build SettingsPage with all subsections
   - Enhance StoriesBar and StoryViewer with reactions, replies, views, creative tools UI, privacy
   - Add CloseFriends management
   - Add VerificationBadge component
   - Add Trending section in Explore
   - Add Tagged posts tab in Profile
   - Enhance MessagesPage with emoji, media, status indicators, block
   - Add safety/report dialogs
   - Add Reels route and bottom nav icon

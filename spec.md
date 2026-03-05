# VibeGram

## Current State
Full-stack social media app on ICP with: Internet Identity auth, home feed with photo posts, stories bar, reels page (basic vertical scroll with snap), explore, upload, profile, messages, notifications, settings, hashtag discovery. Dark neon theme with oklch color tokens. ReelsPage exists but lacks: progress bar, mute/unmute toggle, double-tap like animation, comments slide-up sheet, swipe gesture indicators, and polish.

## Requested Changes (Diff)

### Add
- Instagram-style reels enhancements: video progress bar at top of each reel, mute/unmute button with icon, double-tap to like animation (heart burst in center of screen), comments slide-up bottom sheet directly in ReelsPage (no navigation away), swipe hint indicator on first load
- Neon glow effects on like/comment/share action buttons in reels (pink/purple neon border glow on active state)
- "Swipe up" indicator arrow animation at bottom of first reel (disappears after first scroll)
- Video tap-to-pause/play toggle
- Neon progress bar at top of each reel showing video playback progress

### Modify
- ReelsPage: refactor ReelCard to include all the above - progress bar, mute toggle, double-tap like, tap pause/play, inline comments sheet, neon action button glows
- HomePage: ensure photo posts in feed have neon card borders, like button uses hot-pink neon glow on active, comment section links to post detail modal
- AuthPage: keep existing hot-pink styling, no changes needed
- ProfilePage: ensure consistency with neon theme
- index.css: add neon-glow utility classes for buttons and borders

### Remove
- Nothing removed

## Implementation Plan
1. Add neon glow CSS utilities to index.css (neon-pink-glow, neon-purple-glow, neon-border classes)
2. Rewrite ReelsPage/ReelCard with:
   - Video progress bar (useEffect updating width via requestAnimationFrame)
   - Mute/unmute toggle button (top-right)
   - Tap-to-pause/play on video element
   - Double-tap like with center heart burst animation
   - Inline comments bottom sheet (Sheet component) with comment list and input
   - Swipe-up hint arrow (only shown on first reel, fades after scroll)
   - Neon glow on like (pink), comment (purple), share (blue) action buttons
3. Minor neon polish on PostCard: glowing like button when liked
4. Validate and build

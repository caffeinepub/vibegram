# VibeGram

## Current State
VibeGram is a full-stack social media app. Current upload flows exist for Post, Story, Reels, and Live via MediaCreationHub. Each has its own sheet component (StoryUploadSheet, ReelUploadSheet, LiveStreamSheet). MessagesPage has a text-based chat with ConversationItem and ChatView. No creative tools (filters, stickers, text overlays, music) exist in any creation flow. No audio/video call UI exists in messages.

## Requested Changes (Diff)

### Add
1. **CreativeToolbar component** -- a reusable bottom toolbar that appears after media is selected in Story, Reel, and Post upload flows. Contains tabs/buttons for:
   - **Filters**: horizontal scroll of filter previews (Normal, Warm, Cool, Vivid, Faded, Noir, Rose, Sunset -- CSS filter classes applied as overlay)
   - **Stickers**: emoji sticker panel (grid of popular emojis + category tabs: Smileys, Party, Love, Fire, Nature). Tapping a sticker places it as a draggable overlay on the preview
   - **Text**: opens a text input with font style selector (Normal, Bold, Neon, Shadow, Outline) and color picker row. Text is placed as a draggable overlay on the preview
   - **Music / Song**: shows a mock music picker panel with a list of 8 featured songs (title + artist). Tapping selects the song and shows a music bar at the bottom of the preview with song name + animated music note icon

2. **MediaOverlayCanvas component** -- wraps the media preview area in Story, Reel, and Post upload. Renders placed sticker/text overlays as absolutely positioned elements. Each overlay is tappable to select/delete.

3. **Audio Call UI** in MessagesPage ChatView header -- phone icon button that opens a fullscreen AudioCallSheet simulating an active call (avatar, animated ringing/connected state, mute, speaker, end call buttons)

4. **Video Call UI** in MessagesPage ChatView header -- video camera icon button that opens a fullscreen VideoCallSheet with simulated camera feed area (gradient placeholder), remote user avatar, call controls (mute, camera toggle, end call, switch camera)

5. **CallSheet components** -- AudioCallSheet and VideoCallSheet reusable components with:
   - Animated connection states: ringing → connected → ended
   - Call duration timer (starts when "connected")
   - Mute/unmute, speaker toggle (audio), camera on/off, switch camera (video)
   - End call button with confirm animation
   - Caller/receiver avatar with pulsing ring animation

### Modify
- **StoryUploadSheet** -- after file selection, show CreativeToolbar below preview. Pass selected filter CSS class to preview image/video wrapper. Show placed sticker/text overlays. Show selected song bar.
- **ReelUploadSheet** -- same as story: add CreativeToolbar after video selected, apply filter to preview, show overlays and song bar.
- **UploadPage (Post)** -- same: add CreativeToolbar after media selected, apply filter, show overlays and song bar.
- **LiveStreamSheet** -- add a small toolbar at the bottom near emoji reactions with Filter and Sticker quick-access buttons (simplified version, no text overlay for live).
- **MessagesPage ChatView header** -- add phone icon and video icon buttons to the right of the user name/avatar. Clicking phone opens AudioCallSheet, clicking video opens VideoCallSheet.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/components/CreativeToolbar.tsx` -- tabs: Filters, Stickers, Text, Music. Each tab renders its panel. Callbacks: onFilterSelect(filterClass), onStickerAdd(emoji), onTextAdd({text, style, color}), onMusicSelect(song). Self-contained with internal tab state.
2. Create `src/frontend/src/components/MediaOverlayCanvas.tsx` -- wraps children (media preview), renders overlay items (stickers, text) as absolute positioned draggable elements using pointer events. Accepts overlays array + onOverlayRemove.
3. Create `src/frontend/src/components/AudioCallSheet.tsx` -- fullscreen sheet with call simulation states (ringing 2s → connected), timer, mute/speaker buttons, end call.
4. Create `src/frontend/src/components/VideoCallSheet.tsx` -- same as audio but with camera area placeholder, camera toggle, switch camera.
5. Modify `StoryUploadSheet.tsx` -- integrate CreativeToolbar + MediaOverlayCanvas in preview step. Add filter state, overlays state, selectedSong state.
6. Modify `ReelUploadSheet.tsx` -- same integration.
7. Modify `UploadPage.tsx` -- same integration.
8. Modify `LiveStreamSheet.tsx` -- add simplified filter/sticker quick buttons near emoji bar.
9. Modify `MessagesPage.tsx` ChatView -- add phone + video icon buttons in header, wire up AudioCallSheet/VideoCallSheet.

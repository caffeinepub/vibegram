import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AtSign,
  Check,
  Hash,
  Link,
  Music2,
  Pause,
  Play,
  Search,
  Sliders,
  Smile,
  Type,
} from "lucide-react";
import { useState } from "react";

interface CreativeToolbarProps {
  onFilterSelect: (filterStyle: string) => void;
  onStickerAdd: (emoji: string) => void;
  onTextAdd: (overlay: { text: string; style: string; color: string }) => void;
  onMusicSelect: (song: { title: string; artist: string } | null) => void;
  selectedFilter: string;
  selectedSong: { title: string; artist: string } | null;
}

const FILTERS = [
  { name: "Normal", style: "" },
  { name: "Warm", style: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { name: "Cool", style: "hue-rotate(20deg) saturate(0.9) brightness(1.05)" },
  { name: "Vivid", style: "saturate(1.8) contrast(1.1)" },
  { name: "Faded", style: "saturate(0.6) brightness(1.15) contrast(0.85)" },
  { name: "Noir", style: "grayscale(1) contrast(1.2)" },
  { name: "Rose", style: "sepia(0.4) hue-rotate(-20deg) saturate(1.3)" },
  {
    name: "Sunset",
    style: "sepia(0.5) saturate(1.6) brightness(1.1) hue-rotate(-10deg)",
  },
  // Instagram-style filters
  { name: "Lux", style: "contrast(1.33) brightness(1.1) saturate(1.6)" },
  { name: "Chrome", style: "saturate(0) contrast(1.2) brightness(1.3)" },
  { name: "Inkwell", style: "grayscale(1) brightness(1.1) contrast(1.05)" },
  {
    name: "Clarendon",
    style: "contrast(1.2) saturate(1.35) brightness(1.1)",
  },
  {
    name: "Gingham",
    style: "brightness(1.05) hue-rotate(-10deg) saturate(0.9)",
  },
  {
    name: "Moon",
    style: "grayscale(1) contrast(1.1) brightness(1.1) sepia(0.1)",
  },
  {
    name: "Reyes",
    style: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)",
  },
  { name: "Juno", style: "saturate(1.4) hue-rotate(-5deg) contrast(1.1)" },
  { name: "Slumber", style: "saturate(0.66) brightness(1.05) sepia(0.4)" },
  {
    name: "Crema",
    style: "sepia(0.5) contrast(0.9) brightness(1.25) saturate(0.9)",
  },
] as const;

const STICKER_CATEGORIES = [
  {
    id: "smileys",
    icon: "😊",
    label: "Smileys",
    special: false,
    emojis: [
      "😊",
      "😂",
      "😍",
      "🥰",
      "😎",
      "🤩",
      "😜",
      "🥳",
      "😇",
      "🤗",
      "😮",
      "🤭",
    ],
  },
  {
    id: "party",
    icon: "🎉",
    label: "Party",
    special: false,
    emojis: [
      "🎉",
      "🎊",
      "🎈",
      "🎁",
      "🥂",
      "🎆",
      "🎇",
      "✨",
      "🎭",
      "🎪",
      "🎠",
      "🎯",
    ],
  },
  {
    id: "love",
    icon: "❤️",
    label: "Love",
    special: false,
    emojis: [
      "❤️",
      "💜",
      "💙",
      "💚",
      "🧡",
      "💛",
      "💕",
      "💞",
      "💝",
      "💘",
      "🌹",
      "😘",
    ],
  },
  {
    id: "fire",
    icon: "🔥",
    label: "Fire",
    special: false,
    emojis: [
      "🔥",
      "⚡",
      "💥",
      "🌟",
      "⭐",
      "🌈",
      "💫",
      "🌊",
      "🍀",
      "🦋",
      "🎵",
      "🎶",
    ],
  },
  { id: "mention", icon: "@", label: "@Mention", special: true, emojis: [] },
  { id: "hashtag", icon: "#", label: "#Hashtag", special: true, emojis: [] },
  { id: "link", icon: "link", label: "Social Link", special: true, emojis: [] },
];

const TEXT_STYLES = ["Normal", "Bold", "Neon", "Shadow", "Outline"] as const;
const TEXT_COLORS = [
  { name: "white", value: "#ffffff" },
  { name: "black", value: "#000000" },
  { name: "pink", value: "#ff2fd1" },
  { name: "purple", value: "#a855f7" },
  { name: "blue", value: "#3b82f6" },
  { name: "yellow", value: "#fbbf24" },
  { name: "green", value: "#22c55e" },
  { name: "orange", value: "#f97316" },
] as const;

export type SongGenre = "All" | "Pop" | "Hip-Hop" | "Bollywood" | "R&B" | "EDM";

export type Song = { title: string; artist: string; genre: SongGenre };

export const ALL_SONGS: Song[] = [
  // Pop
  { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop" },
  { title: "Cruel Summer", artist: "Taylor Swift", genre: "Pop" },
  { title: "As It Was", artist: "Harry Styles", genre: "Pop" },
  { title: "Watermelon Sugar", artist: "Harry Styles", genre: "Pop" },
  { title: "Positions", artist: "Ariana Grande", genre: "Pop" },
  { title: "Dynamite", artist: "BTS", genre: "Pop" },
  { title: "Butter", artist: "BTS", genre: "Pop" },
  { title: "Peaches", artist: "Justin Bieber", genre: "Pop" },
  { title: "Stay With Me", artist: "Sam Smith", genre: "Pop" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", genre: "Pop" },
  { title: "Sunflower", artist: "Post Malone", genre: "Pop" },
  { title: "Levitating", artist: "Dua Lipa", genre: "Pop" },
  { title: "Bad Guy", artist: "Billie Eilish", genre: "Pop" },
  { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
  { title: "Shape of You", artist: "Ed Sheeran", genre: "Pop" },
  // Hip-Hop
  { title: "God's Plan", artist: "Drake", genre: "Hip-Hop" },
  { title: "Rockstar", artist: "Post Malone", genre: "Hip-Hop" },
  { title: "HUMBLE.", artist: "Kendrick Lamar", genre: "Hip-Hop" },
  { title: "Old Town Road", artist: "Lil Nas X", genre: "Hip-Hop" },
  { title: "Sicko Mode", artist: "Travis Scott", genre: "Hip-Hop" },
  { title: "Money Trees", artist: "Kendrick Lamar", genre: "Hip-Hop" },
  { title: "Lucid Dreams", artist: "Juice WRLD", genre: "Hip-Hop" },
  { title: "Congratulations", artist: "Post Malone", genre: "Hip-Hop" },
  { title: "Stay", artist: "The Kid LAROI", genre: "Hip-Hop" },
  // Bollywood
  { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood" },
  { title: "Raataan Lambiyan", artist: "Jubin Nautiyal", genre: "Bollywood" },
  { title: "Tum Hi Ho", artist: "Arijit Singh", genre: "Bollywood" },
  { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood" },
  { title: "Besharam Rang", artist: "Shilpa Rao", genre: "Bollywood" },
  { title: "Ghungroo", artist: "Arijit Singh", genre: "Bollywood" },
  { title: "Dil Chahta Hai", artist: "Shankar Mahadevan", genre: "Bollywood" },
  { title: "Tera Yaar Hoon Main", artist: "Arijit Singh", genre: "Bollywood" },
  { title: "Tere Bina", artist: "Guru Randhawa", genre: "Bollywood" },
  { title: "Pasoori", artist: "Ali Sethi & Shae Gill", genre: "Bollywood" },
  { title: "Kahani", artist: "Ritviz", genre: "Bollywood" },
  { title: "Kalank", artist: "Arijit Singh", genre: "Bollywood" },
  // R&B
  { title: "Essence", artist: "Wizkid ft. Tems", genre: "R&B" },
  { title: "Leave The Door Open", artist: "Bruno Mars", genre: "R&B" },
  { title: "Mood", artist: "24kGoldn", genre: "R&B" },
  { title: "Drivers License", artist: "Olivia Rodrigo", genre: "R&B" },
  { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar", genre: "R&B" },
  { title: "MONTERO", artist: "Lil Nas X", genre: "R&B" },
  // EDM
  { title: "Blinding Lights", artist: "The Weeknd", genre: "EDM" },
  {
    title: "Don't You Worry Child",
    artist: "Swedish House Mafia",
    genre: "EDM",
  },
  { title: "Titanium", artist: "David Guetta", genre: "EDM" },
  { title: "Lean On", artist: "Major Lazer", genre: "EDM" },
  { title: "Closer", artist: "The Chainsmokers", genre: "EDM" },
  { title: "Animals", artist: "Martin Garrix", genre: "EDM" },
  { title: "Levels", artist: "Avicii", genre: "EDM" },
  { title: "Wake Me Up", artist: "Avicii", genre: "EDM" },
];

const SONG_GENRES: SongGenre[] = [
  "All",
  "Pop",
  "Hip-Hop",
  "Bollywood",
  "R&B",
  "EDM",
];

type TabId = "filters" | "stickers" | "text" | "music";

const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
  { id: "filters", icon: <Sliders size={16} />, label: "Filters" },
  { id: "stickers", icon: <Smile size={16} />, label: "Stickers" },
  { id: "text", icon: <Type size={16} />, label: "Text" },
  { id: "music", icon: <Music2 size={16} />, label: "Music" },
];

/** Play a short 440Hz beep via Web Audio API for simulated preview */
function playBeep(durationMs = 600) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000,
    );
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => ctx.close(), durationMs + 100);
  } catch {
    // Silently fail if AudioContext is unavailable
  }
}

export function CreativeToolbar({
  onFilterSelect,
  onStickerAdd,
  onTextAdd,
  onMusicSelect,
  selectedFilter,
  selectedSong,
}: CreativeToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("filters");
  const [stickerCategory, setStickerCategory] = useState("smileys");
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState("Normal");
  const [textColor, setTextColor] = useState("#ffffff");
  const [mentionInput, setMentionInput] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [musicGenre, setMusicGenre] = useState<SongGenre>("All");
  const [musicSearch, setMusicSearch] = useState("");
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const handlePlayPause = (key: string) => {
    if (playingKey === key) {
      setPlayingKey(null);
    } else {
      setPlayingKey(key);
      playBeep(600);
      setTimeout(
        () => setPlayingKey((curr) => (curr === key ? null : curr)),
        3000,
      );
    }
  };

  const filteredSongs = ALL_SONGS.filter((s) => {
    const matchesGenre = musicGenre === "All" || s.genre === musicGenre;
    const q = musicSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q);
    return matchesGenre && matchesSearch;
  });

  return (
    <div
      className="rounded-2xl overflow-hidden border border-border"
      style={{ background: "oklch(0.14 0.012 265)" }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            data-ocid={`creative.toolbar.${tab.id}.tab`}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3">
        {/* FILTERS */}
        {activeTab === "filters" && (
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-2 pb-1">
              {FILTERS.map((filter) => {
                const isSelected = selectedFilter === filter.style;
                return (
                  <button
                    key={filter.name}
                    type="button"
                    onClick={() => onFilterSelect(filter.style)}
                    data-ocid={`creative.filters.${filter.name.toLowerCase()}.button`}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all",
                      isSelected
                        ? "text-white"
                        : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                    )}
                    style={
                      isSelected
                        ? {
                            background:
                              "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                            boxShadow: "0 0 12px oklch(0.62 0.22 295 / 0.5)",
                          }
                        : undefined
                    }
                  >
                    {filter.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STICKERS */}
        {activeTab === "stickers" && (
          <div className="space-y-2">
            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {STICKER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setStickerCategory(cat.id)}
                  data-ocid={`creative.stickers.${cat.id}.tab`}
                  className={cn(
                    "shrink-0 px-2.5 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    stickerCategory === cat.id
                      ? "bg-primary/20 border border-primary/50 text-white"
                      : "bg-secondary/60 hover:bg-secondary text-muted-foreground",
                    cat.special && "font-black tracking-tight",
                  )}
                  style={
                    stickerCategory === cat.id && cat.special
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.62 0.22 295 / 0.25), oklch(0.65 0.25 350 / 0.25))",
                          borderColor: "oklch(0.62 0.22 295 / 0.6)",
                        }
                      : undefined
                  }
                >
                  {cat.special ? (
                    cat.id === "link" ? (
                      <Link size={14} />
                    ) : (
                      <span className="text-base leading-none">{cat.icon}</span>
                    )
                  ) : (
                    <span className="text-lg">{cat.icon}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Special: @Mention input */}
            {stickerCategory === "mention" && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={mentionInput}
                    onChange={(e) =>
                      setMentionInput(e.target.value.replace(/^@/, ""))
                    }
                    placeholder="username"
                    className="bg-secondary border-border text-sm h-9 pl-7"
                    data-ocid="creative.stickers.mention.input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && mentionInput.trim()) {
                        onStickerAdd(`@${mentionInput.trim()}`);
                        setMentionInput("");
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!mentionInput.trim()}
                  onClick={() => {
                    if (!mentionInput.trim()) return;
                    onStickerAdd(`@${mentionInput.trim()}`);
                    setMentionInput("");
                  }}
                  data-ocid="creative.stickers.mention.button"
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Special: #Hashtag input */}
            {stickerCategory === "hashtag" && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={hashtagInput}
                    onChange={(e) =>
                      setHashtagInput(e.target.value.replace(/^#/, ""))
                    }
                    placeholder="hashtag"
                    className="bg-secondary border-border text-sm h-9 pl-7"
                    data-ocid="creative.stickers.hashtag.input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && hashtagInput.trim()) {
                        onStickerAdd(`#${hashtagInput.trim()}`);
                        setHashtagInput("");
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!hashtagInput.trim()}
                  onClick={() => {
                    if (!hashtagInput.trim()) return;
                    onStickerAdd(`#${hashtagInput.trim()}`);
                    setHashtagInput("");
                  }}
                  data-ocid="creative.stickers.hashtag.button"
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Special: Social Link input */}
            {stickerCategory === "link" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-0.5">
                  Add a social link sticker to your story
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://..."
                      className="bg-secondary border-border text-sm h-9 pl-7"
                      data-ocid="creative.stickers.link.input"
                      type="url"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && linkInput.trim()) {
                          onStickerAdd(`🔗 ${linkInput.trim()}`);
                          setLinkInput("");
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!linkInput.trim()}
                    onClick={() => {
                      if (!linkInput.trim()) return;
                      onStickerAdd(`🔗 ${linkInput.trim()}`);
                      setLinkInput("");
                    }}
                    data-ocid="creative.stickers.link.button"
                    className="h-9 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Emoji grid for regular categories */}
            {STICKER_CATEGORIES.filter(
              (c) => c.id === stickerCategory && !c.special,
            ).map((cat) => (
              <div
                key={cat.id}
                className="grid grid-cols-6 gap-1.5 max-h-28 overflow-y-auto scrollbar-none"
              >
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onStickerAdd(emoji)}
                    data-ocid="creative.stickers.button"
                    className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl bg-secondary/60 hover:bg-secondary active:scale-90 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* TEXT */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="bg-secondary border-border text-sm h-9"
              data-ocid="creative.text.input"
            />

            {/* Font styles */}
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex gap-2 pb-1">
                {TEXT_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTextStyle(style)}
                    data-ocid={`creative.text.${style.toLowerCase()}.toggle`}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs transition-all",
                      textStyle === style
                        ? "text-white"
                        : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                      style === "Bold" && "font-bold",
                      style === "Shadow" &&
                        "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                    )}
                    style={
                      textStyle === style
                        ? {
                            background:
                              "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                          }
                        : undefined
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Color row */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setTextColor(c.value)}
                  data-ocid={`creative.text.${c.name}.toggle`}
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full border-2 transition-all",
                    textColor === c.value
                      ? "border-white scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>

            {/* Add text button */}
            <button
              type="button"
              disabled={!textInput.trim()}
              onClick={() => {
                if (!textInput.trim()) return;
                onTextAdd({
                  text: textInput,
                  style: textStyle,
                  color: textColor,
                });
                setTextInput("");
              }}
              data-ocid="creative.text.add.button"
              className="w-full h-9 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              }}
            >
              Add Text
            </button>
          </div>
        )}

        {/* MUSIC */}
        {activeTab === "music" && (
          <div className="space-y-2">
            {/* Search input */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
                placeholder="Search songs..."
                className="bg-secondary border-border text-xs h-8 pl-7"
                data-ocid="creative.music.search.input"
              />
            </div>

            {/* Genre tabs - hidden when searching */}
            {!musicSearch && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {SONG_GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setMusicGenre(genre)}
                    data-ocid={`creative.music.${genre.toLowerCase().replace(/[^a-z0-9]/g, "_")}.tab`}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      musicGenre === genre
                        ? "text-white"
                        : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                    )}
                    style={
                      musicGenre === genre
                        ? {
                            background:
                              "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                          }
                        : undefined
                    }
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-none">
              {filteredSongs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No songs found
                </p>
              )}
              {filteredSongs.map((song) => {
                const key = `${song.title}-${song.artist}`;
                const isSelected =
                  selectedSong?.title === song.title &&
                  selectedSong?.artist === song.artist;
                const isPlaying = playingKey === key;
                return (
                  <div
                    key={key}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all",
                      isSelected
                        ? "border border-primary/50"
                        : "bg-secondary/60 hover:bg-secondary",
                    )}
                    style={
                      isSelected
                        ? { background: "oklch(0.62 0.22 295 / 0.15)" }
                        : undefined
                    }
                  >
                    {/* Play/Pause button */}
                    <button
                      type="button"
                      onClick={() => handlePlayPause(key)}
                      data-ocid="creative.music.play.button"
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white transition-all active:scale-90"
                      style={{
                        background: isPlaying
                          ? "linear-gradient(135deg, oklch(0.65 0.25 350), oklch(0.62 0.22 295))"
                          : "oklch(0.22 0.015 280)",
                      }}
                      aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    >
                      {isPlaying ? (
                        <Pause size={11} className="fill-white" />
                      ) : (
                        <Play size={11} className="fill-white ml-0.5" />
                      )}
                    </button>

                    {/* Song info - tap to select */}
                    <button
                      type="button"
                      onClick={() =>
                        onMusicSelect(
                          isSelected
                            ? null
                            : { title: song.title, artist: song.artist },
                        )
                      }
                      data-ocid="creative.music.button"
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-semibold truncate text-foreground">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </button>

                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

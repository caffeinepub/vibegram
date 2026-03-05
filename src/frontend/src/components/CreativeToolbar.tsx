import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Music2, Sliders, Smile, Type } from "lucide-react";
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
] as const;

const STICKER_CATEGORIES = [
  {
    id: "smileys",
    icon: "😊",
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
] as const;

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

const SONGS = [
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Levitating", artist: "Dua Lipa" },
  { title: "Stay", artist: "The Kid LAROI" },
  { title: "Bad Guy", artist: "Billie Eilish" },
  { title: "Flowers", artist: "Miley Cyrus" },
  { title: "As It Was", artist: "Harry Styles" },
  { title: "Anti-Hero", artist: "Taylor Swift" },
] as const;

type TabId = "filters" | "stickers" | "text" | "music";

const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
  { id: "filters", icon: <Sliders size={16} />, label: "Filters" },
  { id: "stickers", icon: <Smile size={16} />, label: "Stickers" },
  { id: "text", icon: <Type size={16} />, label: "Text" },
  { id: "music", icon: <Music2 size={16} />, label: "Music" },
];

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
                    "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all",
                    stickerCategory === cat.id
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-secondary/60 hover:bg-secondary",
                  )}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            {STICKER_CATEGORIES.filter((c) => c.id === stickerCategory).map(
              (cat) => (
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
              ),
            )}
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
            <p className="text-xs text-muted-foreground font-medium px-1">
              Add a Song
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-none">
              {SONGS.map((song) => {
                const isSelected =
                  selectedSong?.title === song.title &&
                  selectedSong?.artist === song.artist;
                return (
                  <button
                    key={`${song.title}-${song.artist}`}
                    type="button"
                    onClick={() =>
                      onMusicSelect(
                        isSelected
                          ? null
                          : { title: song.title, artist: song.artist },
                      )
                    }
                    data-ocid="creative.music.button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                      isSelected
                        ? "border border-primary/50"
                        : "bg-secondary/60 hover:bg-secondary",
                    )}
                    style={
                      isSelected
                        ? {
                            background: "oklch(0.62 0.22 295 / 0.15)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))"
                          : "oklch(0.22 0.015 280)",
                      }}
                    >
                      <Music2 size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

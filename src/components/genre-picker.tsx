import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export const GENRE_GROUPS: Record<string, string[]> = {
  Zimbabwean: [
    "Zimdancehall",
    "Sungura",
    "Chimurenga",
    "Museve",
    "Jiti",
    "Mbira",
    "Zim Hip-Hop",
    "Zim Gospel",
    "Urban Grooves",
    "Tuku Music",
    "Borrowdale",
    "Mhande",
    "Dinhe",
    "Mbakumba",
    "Katekwe",
  ],
  African: [
    "Afro-Pop",
    "Afrobeats",
    "Amapiano",
    "Gqom",
    "Kwaito",
    "Bongo Flava",
    "Kwassa Kwassa",
    "Soukous",
    "Highlife",
    "Kizomba",
    "Maskandi",
    "Mbaqanga",
    "Kuduro",
    "Genge",
  ],
  "Urban & Hip-Hop": ["Hip-Hop", "Rap", "Trap", "R&B", "Soul", "Neo-Soul", "Drill", "Grime"],
  "Electronic & Dance": [
    "House",
    "Deep House",
    "Afro House",
    "Techno",
    "EDM",
    "Drum & Bass",
    "Dubstep",
    "Garage",
    "Trance",
  ],
  "Caribbean & Latin": [
    "Dancehall",
    "Reggae",
    "Roots Reggae",
    "Soca",
    "Reggaeton",
    "Latin Pop",
    "Salsa",
    "Bachata",
  ],
  "Pop, Rock & Alternative": [
    "Pop",
    "Rock",
    "Alternative",
    "Indie",
    "Metal",
    "Punk",
    "Folk",
    "Country",
  ],
  "Gospel & Spiritual": ["Gospel", "Contemporary Gospel", "Worship", "Christian"],
  "Jazz, Classical & Other": [
    "Jazz",
    "Afro-Jazz",
    "Blues",
    "Classical",
    "Instrumental",
    "Lo-fi",
    "Ambient",
    "Spoken Word",
    "Podcast",
    "Other",
  ],
};

export function GenrePicker({
  value,
  onChange,
  placeholder = "Search or select a genre",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GENRE_GROUPS;
    const out: Record<string, string[]> = {};
    for (const [g, items] of Object.entries(GENRE_GROUPS)) {
      const match = items.filter((n) => n.toLowerCase().includes(q));
      if (match.length) out[g] = match;
    }
    return out;
  }, [query]);

  const hasResults = Object.keys(groups).length > 0;
  const showCustom =
    query.trim().length > 0 &&
    !Object.values(GENRE_GROUPS)
      .flat()
      .some((n) => n.toLowerCase() === query.trim().toLowerCase());

  const select = (v: string) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3.5 text-left text-sm outline-none ring-1 ring-border focus:ring-primary"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select genre"}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              aria-label="Clear genre"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {hasResults ? (
              Object.entries(groups).map(([g, items]) => (
                <div key={g} className="py-1">
                  <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {g}
                  </div>
                  {items.map((name) => {
                    const active = name === value;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => select(name)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5 ${
                          active ? "text-primary" : "text-foreground"
                        }`}
                      >
                        <span>{name}</span>
                        {active && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No matching genre.
              </div>
            )}

            {showCustom && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => select(query.trim())}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-primary hover:bg-primary/10"
                >
                  <span className="font-medium">Use &ldquo;{query.trim()}&rdquo;</span>
                  <span className="text-xs text-muted-foreground">— add as custom genre</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

type Row =
  | { kind: "header"; group: string }
  | { kind: "item"; group: string; name: string; itemIndex: number }
  | { kind: "custom"; value: string };

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
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  const trimmed = query.trim();
  const showCustom =
    trimmed.length > 0 &&
    !Object.values(GENRE_GROUPS)
      .flat()
      .some((n) => n.toLowerCase() === trimmed.toLowerCase());

  // Flat row list: headers, items, optional custom row. Only items are selectable.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let i = 0;
    for (const [g, items] of Object.entries(groups)) {
      out.push({ kind: "header", group: g });
      for (const name of items) {
        out.push({ kind: "item", group: g, name, itemIndex: i++ });
      }
    }
    if (showCustom) out.push({ kind: "custom", value: trimmed });
    return out;
  }, [groups, showCustom, trimmed]);

  const selectableIdx = useMemo(
    () =>
      rows
        .map((r, i) => (r.kind === "item" || r.kind === "custom" ? i : -1))
        .filter((i) => i >= 0),
    [rows],
  );

  // Reset / clamp active index when list changes
  useEffect(() => {
    if (!selectableIdx.length) {
      setActiveIdx(-1);
      return;
    }
    // Prefer current value if visible, else first selectable
    const currentInList = rows.findIndex((r) => r.kind === "item" && r.name === value);
    setActiveIdx(currentInList >= 0 ? currentInList : selectableIdx[0]);
  }, [rows, value, selectableIdx]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Smooth scroll active row into view
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const el = itemRefs.current[activeIdx];
    if (el && "scrollIntoView" in el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIdx, open]);

  const move = (dir: 1 | -1) => {
    if (!selectableIdx.length) return;
    const pos = selectableIdx.indexOf(activeIdx);
    const nextPos =
      pos < 0
        ? dir === 1
          ? 0
          : selectableIdx.length - 1
        : (pos + dir + selectableIdx.length) % selectableIdx.length;
    setActiveIdx(selectableIdx[nextPos]);
  };

  const selectRow = (row: Row) => {
    if (row.kind === "item") onChange(row.name);
    else if (row.kind === "custom") onChange(row.value);
    else return;
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (selectableIdx.length) setActiveIdx(selectableIdx[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      if (selectableIdx.length) setActiveIdx(selectableIdx[selectableIdx.length - 1]);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      for (let i = 0; i < 6; i++) move(1);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      for (let i = 0; i < 6; i++) move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[activeIdx];
      if (row) selectRow(row);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3.5 text-left text-sm outline-none ring-1 ring-border transition focus:ring-primary"
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
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95"
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              aria-autocomplete="list"
              aria-controls="genre-list"
              aria-activedescendant={
                activeIdx >= 0 ? `genre-row-${activeIdx}` : undefined
              }
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

          <div
            ref={listRef}
            id="genre-list"
            className="genre-scroll max-h-72 overflow-y-auto scroll-smooth py-1"
          >
            {rows.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No matching genre.
              </div>
            )}

            {rows.map((row, i) => {
              if (row.kind === "header") {
                return (
                  <div
                    key={`h-${row.group}`}
                    className="sticky top-0 z-10 bg-popover/95 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur"
                  >
                    {row.group}
                  </div>
                );
              }
              if (row.kind === "custom") {
                const active = i === activeIdx;
                return (
                  <button
                    key="custom"
                    id={`genre-row-${i}`}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => selectRow(row)}
                    className={`flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? "bg-primary/15 text-primary" : "text-primary hover:bg-primary/10"
                    }`}
                  >
                    <span className="font-medium">Use &ldquo;{row.value}&rdquo;</span>
                    <span className="text-xs text-muted-foreground">— add as custom genre</span>
                  </button>
                );
              }
              const active = i === activeIdx;
              const selected = row.name === value;
              return (
                <button
                  key={`${row.group}-${row.name}`}
                  id={`genre-row-${i}`}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => selectRow(row)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-white/10" : ""
                  } ${selected ? "text-primary" : "text-foreground"}`}
                >
                  <span>{row.name}</span>
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-surface/40 px-3 py-1.5 text-[10px] text-muted-foreground">
            <span>
              <kbd className="rounded bg-white/10 px-1">↑</kbd>{" "}
              <kbd className="rounded bg-white/10 px-1">↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded bg-white/10 px-1">↵</kbd> select ·{" "}
              <kbd className="rounded bg-white/10 px-1">esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

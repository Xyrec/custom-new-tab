import { useState, useRef, useCallback, useEffect } from "react";
import type { TopSite } from "@/hooks/useTopSites";
import { SiteEditModal } from "./SiteEditModal";
import { getFaviconAttempts } from "@/lib/favicon";
import { getColumnsCountFromElement } from "@/lib/grid";
import { Pin, Plus, Ellipsis, Pencil, Trash2, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TopSitesProps {
  sites: TopSite[];
  onPin: (index: number) => void;
  onUnpin: (index: number) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, title: string, url: string) => void;
  onAdd: (title: string, url: string) => void;
  onMove: (from: number, to: number) => void;
}

const MAX_ROWS = 3;

export function TopSites({
  sites,
  onPin,
  onUnpin,
  onRemove,
  onEdit,
  onAdd,
  onMove,
}: TopSitesProps) {
  const [editModal, setEditModal] = useState<{
    mode: "edit" | "add";
    index?: number;
    title?: string;
    url?: string;
  } | null>(null);

  const gridRef = useRef<HTMLUListElement>(null);
  const [cols, setCols] = useState(8);
  useEffect(() => {
    const update = () => setCols(getColumnsCountFromElement(gridRef.current));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const visibleCount = MAX_ROWS * cols;
  const visibleSites = sites.slice(0, visibleCount);
  const showAddButton = visibleSites.length < visibleCount;

  return (
    <section className="relative">
      <ul ref={gridRef} className="top-sites-list">
        {visibleSites.map((site, i) => (
          <TopSiteTile
            key={`${site.url}-${i}`}
            site={site}
            index={i}
            onPin={() => onPin(i)}
            onUnpin={() => onUnpin(i)}
            onRemove={() => onRemove(i)}
            onEdit={() =>
              setEditModal({
                mode: "edit",
                index: i,
                title: site.customTitle || site.title,
                url: site.customUrl || site.url,
              })
            }
            onDragStart={handleDragStart}
            onDrop={(from, to) => onMove(from, to)}
          />
        ))}
        {showAddButton && (
          <li className="px-1 relative">
            <div className="relative">
              <button
                className="flex flex-col items-center no-underline cursor-pointer py-2 rounded-2xl border-none bg-transparent w-full transition-colors hover:bg-accent"
                onClick={() => setEditModal({ mode: "add" })}
              >
                <div className="size-16 rounded-2xl flex items-center justify-center mb-1 shrink-0">
                  <div className="size-full rounded-2xl flex items-center justify-center border-2 border-dashed border-border bg-transparent">
                    <Plus size={20} className="text-muted-foreground" />
                  </div>
                </div>
                <span className="text-xs text-center max-w-20 truncate leading-tight">
                  Add shortcut
                </span>
              </button>
            </div>
          </li>
        )}
      </ul>

      {editModal && (
        <SiteEditModal
          mode={editModal.mode}
          initialTitle={editModal.title || ""}
          initialUrl={editModal.url || ""}
          onSave={(title, url) => {
            if (editModal.mode === "edit" && editModal.index !== undefined) {
              onEdit(editModal.index, title, url);
            } else {
              onAdd(title, url);
            }
            setEditModal(null);
          }}
          onCancel={() => setEditModal(null)}
        />
      )}
    </section>
  );
}

let dragSourceIndex: number | null = null;

function handleDragStart(index: number) {
  dragSourceIndex = index;
}

interface TopSiteTileProps {
  site: TopSite;
  index: number;
  onPin: () => void;
  onUnpin: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onDragStart: (index: number) => void;
  onDrop: (from: number, to: number) => void;
}

function TopSiteTile({
  site,
  index,
  onPin,
  onUnpin,
  onRemove,
  onEdit,
  onDragStart,
  onDrop,
}: TopSiteTileProps) {
  const [dragOver, setDragOver] = useState(false);
  const [faviconAttemptIndex, setFaviconAttemptIndex] = useState(0);

  const faviconAttempts = getFaviconAttempts(site.url);

  useEffect(() => {
    setFaviconAttemptIndex(0);
  }, [site.url]);

  const faviconUrl = faviconAttempts[faviconAttemptIndex];
  const showFallback =
    faviconAttempts.length === 0 || faviconAttemptIndex >= faviconAttempts.length || !faviconUrl;

  const advanceFavicon = useCallback(() => {
    setFaviconAttemptIndex((i) => i + 1);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (dragSourceIndex !== null && dragSourceIndex !== index) {
        onDrop(dragSourceIndex, index);
      }
      dragSourceIndex = null;
    },
    [index, onDrop],
  );

  return (
    <li
      className={`px-1 relative ${dragOver ? "outline-2 outline-primary outline-offset-2 rounded-2xl" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative group">
        <a
          className="flex flex-col items-center no-underline text-foreground cursor-pointer py-2 rounded-2xl border-none bg-transparent w-full transition-colors hover:bg-accent"
          href={site.url}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(index));
            onDragStart(index);
            requestAnimationFrame(() => {
              (e.target as HTMLElement).closest("li")?.classList.add("opacity-40");
            });
          }}
          onDragEnd={(e) => {
            (e.target as HTMLElement).closest("li")?.classList.remove("opacity-40");
            dragSourceIndex = null;
          }}
        >
          <div className="size-16 rounded-2xl flex items-center justify-center mb-1 relative overflow-hidden shrink-0">
            {showFallback ? (
              <div className="size-full rounded-2xl flex items-center justify-center bg-card shadow-[inset_0_0_0_1px_var(--border)] overflow-hidden">
                <Globe size={24} className="text-muted-foreground" />
              </div>
            ) : (
              <div className="size-full rounded-2xl flex items-center justify-center bg-card shadow-[inset_0_0_0_1px_var(--border)] overflow-hidden">
                <img
                  key={`${faviconAttemptIndex}-${faviconUrl}`}
                  className="size-8 rounded-sm"
                  src={faviconUrl}
                  alt=""
                  loading="lazy"
                  onError={advanceFavicon}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
                      advanceFavicon();
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div
            className={`text-xs text-center max-w-20 truncate leading-tight ${site.pinned ? "flex items-center gap-0.5" : ""}`}
          >
            {site.pinned && <Pin size={12} className="size-3 shrink-0" />}
            <span>{site.customTitle || site.title || getDomain(site.url)}</span>
          </div>
        </a>

        <div className="absolute top-0.5 right-0.5 z-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <Ellipsis size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              {site.pinned ? (
                <DropdownMenuItem onClick={onUnpin}>
                  <Pin size={16} />
                  Unpin
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onPin}>
                  <Pin size={16} />
                  Pin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Pencil size={16} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                <Trash2 size={16} />
                Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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
import { Card, CardContent } from "@/components/ui/card";

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

  const gridRef = useRef<HTMLDivElement>(null);
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
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-3 gap-y-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
      >
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
          <div className="px-1">
            <Button
              variant="outline"
              className="w-full no-underline border-dashed border-2 h-full aspect-square"
              onClick={() => setEditModal({ mode: "add" })}
            >
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add shortcut</span>
            </Button>
          </div>
        )}
      </div>

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
    </>
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
    <div
      className={`group relative px-1 ${dragOver ? "rounded-2xl outline-2 outline-primary outline-offset-2" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <a
        className="no-underline"
        href={site.url}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(index));
          onDragStart(index);
        }}
        onDragEnd={() => {
          dragSourceIndex = null;
        }}
      >
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
              {showFallback ? (
                <Globe size={24} className="text-muted-foreground" />
              ) : (
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
              )}
            </div>
            <div className="flex max-w-20 items-center gap-0.5 text-center text-xs leading-tight">
              {site.pinned && <Pin size={12} className="shrink-0" />}
              <span className="truncate">
                {site.customTitle || site.title || getDomain(site.url)}
              </span>
            </div>
          </CardContent>
        </Card>
      </a>

      <div className="absolute top-1 right-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-xs" />}>
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
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

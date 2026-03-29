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
      <div ref={gridRef}>
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
          <>
            <Button onClick={() => setEditModal({ mode: "add" })}>
              <Plus size={20} />
              Add shortcut
            </Button>
          </>
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
    faviconAttempts.length === 0 ||
    faviconAttemptIndex >= faviconAttempts.length ||
    !faviconUrl;

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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <a
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
        {showFallback ? (
          <Globe size={24} />
        ) : (
          <img
            key={`${faviconAttemptIndex}-${faviconUrl}`}
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
        {site.pinned && <Pin size={12} />}
        <span>{site.customTitle || site.title || getDomain(site.url)}</span>
      </a>

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
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

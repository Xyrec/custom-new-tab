import { useState, useRef, useCallback, useEffect } from "react";
import type { TopSite } from "../hooks/useTopSites";
import { SiteEditModal } from "./SiteEditModal";
import { getFaviconUrl } from "../lib/favicon";
import { Pin, Plus, Ellipsis, Pencil, Trash2, Globe } from "lucide-react";

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

  // How many columns are visible (responsive)
  const getCols = () => {
    const w = window.innerWidth;
    if (w <= 510) return 3;
    if (w <= 610) return 4;
    if (w <= 1122) return 6;
    return 8;
  };

  const [cols, setCols] = useState(getCols);
  useEffect(() => {
    const onResize = () => setCols(getCols());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibleCount = MAX_ROWS * cols;
  const visibleSites = sites.slice(0, visibleCount);
  const showAddButton = visibleSites.length < visibleCount;

  return (
    <section className="top-sites" data-section-id="topsites">
      <ul className="top-sites-list">
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
          <li className="top-site-outer add-button">
            <div className="top-site-inner">
              <button
                className="top-site-button"
                onClick={() => setEditModal({ mode: "add" })}
                title="Add shortcut"
              >
                <div className="tile" aria-hidden>
                  <div className="icon-wrapper">
                    <Plus size={20} />
                  </div>
                </div>
                <div className="top-site-title">Add shortcut</div>
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

// Drag state shared across tiles
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  const faviconUrl = getFaviconUrl(site.url);
  const showFallback = !faviconUrl || faviconError;

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
      className={`top-site-outer${dragOver ? " drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="top-site-inner">
        <a
          className="top-site-button"
          href={site.url}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(index));
            onDragStart(index);
            // Add dragging class after a tick so the drag image captures the normal state
            requestAnimationFrame(() => {
              (e.target as HTMLElement).closest(".top-site-outer")?.classList.add("dragging");
            });
          }}
          onDragEnd={(e) => {
            (e.target as HTMLElement).closest(".top-site-outer")?.classList.remove("dragging");
            dragSourceIndex = null;
          }}
        >
          <div className="tile" aria-hidden="true">
            {showFallback ? (
              <div className="icon-wrapper">
                <Globe size={24} className="icon-fallback" />
              </div>
            ) : (
              <div className="icon-wrapper">
                <img
                  className="top-site-icon favicon-image"
                  src={faviconUrl}
                  alt=""
                  loading="lazy"
                  onError={() => setFaviconError(true)}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
                      setFaviconError(true);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className={`top-site-title${site.pinned ? " pinned" : ""}`}>
            {site.pinned && <Pin size={12} className="icon-pin-small" />}
            <span>{site.customTitle || site.title || getDomain(site.url)}</span>
          </div>
        </a>

        <div className="context-menu-wrapper" ref={menuRef}>
          <button
            className="context-menu-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="More options"
            title="More options"
          >
            <Ellipsis size={16} />
          </button>

          {menuOpen && (
            <ContextMenu
              site={site}
              onPin={() => {
                onPin();
                setMenuOpen(false);
              }}
              onUnpin={() => {
                onUnpin();
                setMenuOpen(false);
              }}
              onEdit={() => {
                onEdit();
                setMenuOpen(false);
              }}
              onRemove={() => {
                onRemove();
                setMenuOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </li>
  );
}

interface ContextMenuProps {
  site: TopSite;
  onPin: () => void;
  onUnpin: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function ContextMenu({ site, onPin, onUnpin, onEdit, onRemove }: ContextMenuProps) {
  return (
    <ul className="context-menu" role="menu">
      {site.pinned ? (
        <li>
          <button className="context-menu-item" role="menuitem" onClick={onUnpin}>
            <Pin size={16} />
            Unpin
          </button>
        </li>
      ) : (
        <li>
          <button className="context-menu-item" role="menuitem" onClick={onPin}>
            <Pin size={16} />
            Pin
          </button>
        </li>
      )}
      <li>
        <button className="context-menu-item" role="menuitem" onClick={onEdit}>
          <Pencil size={16} />
          Edit
        </button>
      </li>
      <li className="context-menu-separator" role="separator" />
      <li>
        <button className="context-menu-item" role="menuitem" onClick={onRemove}>
          <Trash2 size={16} />
          Dismiss
        </button>
      </li>
    </ul>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

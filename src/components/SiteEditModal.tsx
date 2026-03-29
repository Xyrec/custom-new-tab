import { useState, useRef, useEffect } from "react";

interface SiteEditModalProps {
  mode: "edit" | "add";
  initialTitle: string;
  initialUrl: string;
  onSave: (title: string, url: string) => void;
  onCancel: () => void;
}

export function SiteEditModal({
  mode,
  initialTitle,
  initialUrl,
  onSave,
  onCancel,
}: SiteEditModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave(title.trim(), url.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{mode === "edit" ? "Edit shortcut" : "Add shortcut"}</h3>

        <div className="modal-field">
          <label htmlFor="site-title">Title</label>
          <input
            id="site-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Google"
          />
        </div>

        <div className="modal-field">
          <label htmlFor="site-url">URL</label>
          <input
            id="site-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://google.com"
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!url.trim()}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

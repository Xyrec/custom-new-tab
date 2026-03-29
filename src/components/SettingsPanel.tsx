import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  rows: number;
  onRowsChange: (rows: number) => void;
}

export function SettingsPanel({ open, onClose, rows, onRowsChange }: SettingsPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="settings-panel-backdrop" onClick={onClose} />
      <div className="settings-panel" role="dialog" aria-label="Settings">
        <div className="settings-panel-header">
          <h2>Shortcuts</h2>
          <button
            ref={closeRef}
            className="settings-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="setting-subsection">
          <div className="rows-selector">
            <label htmlFor="rows-select">Rows</label>
            <select
              id="rows-select"
              value={rows}
              onChange={(e) => onRowsChange(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

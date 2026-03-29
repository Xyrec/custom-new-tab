import { useRef, useState } from "react";
import { useTopSites } from "./hooks/useTopSites";
import { TopSites } from "./components/TopSites";
import { Import } from "lucide-react";

export default function App() {
  const {
    sites,
    loading,
    pinSite,
    unpinSite,
    removeSite,
    editSite,
    addSite,
    moveSite,
    importFromFirefox,
  } = useTopSites();

  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (loading) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importFromFirefox(file);
      setImportStatus(`Imported ${count} sites from Firefox`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus("Failed — select a Firefox prefs.js file");
      setTimeout(() => setImportStatus(null), 3000);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <div className="outer-wrapper">
        <TopSites
          sites={sites}
          onPin={pinSite}
          onUnpin={unpinSite}
          onRemove={removeSite}
          onEdit={editSite}
          onAdd={addSite}
          onMove={moveSite}
        />
      </div>

      <div className="import-button-wrapper">
        <button
          className="import-button"
          onClick={() => fileRef.current?.click()}
          title="Import from Firefox (prefs.js)"
        >
          <Import size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".js"
          onChange={handleImport}
          hidden
        />
        {importStatus && <div className="import-toast">{importStatus}</div>}
      </div>
    </>
  );
}

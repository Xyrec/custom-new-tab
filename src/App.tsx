import { useState } from "react";
import { useTopSites } from "./hooks/useTopSites";
import { TopSites } from "./components/TopSites";
import { SettingsPanel } from "./components/SettingsPanel";
import { GearIcon } from "./components/Icons";

export default function App() {
  const {
    sites,
    rows,
    loading,
    pinSite,
    unpinSite,
    removeSite,
    editSite,
    addSite,
    moveSite,
    setRows,
  } = useTopSites();

  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) return null;

  return (
    <>
      <div className="outer-wrapper">
        <TopSites
          sites={sites}
          rows={rows}
          onPin={pinSite}
          onUnpin={unpinSite}
          onRemove={removeSite}
          onEdit={editSite}
          onAdd={addSite}
          onMove={moveSite}
        />
      </div>

      <div className="personalize-button-wrapper">
        <button
          className="personalize-button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Customize shortcuts"
          title="Customize shortcuts"
        >
          <GearIcon />
        </button>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        rows={rows}
        onRowsChange={setRows}
      />
    </>
  );
}

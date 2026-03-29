import { useTopSites } from "./hooks/useTopSites";
import { TopSites } from "./components/TopSites";

export default function App() {
  const { sites, loading, pinSite, unpinSite, removeSite, editSite, addSite, moveSite } =
    useTopSites();

  if (loading) return null;

  return (
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
  );
}

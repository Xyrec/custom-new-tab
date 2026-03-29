import { useRef } from "react";
import { useTopSites } from "@/hooks/useTopSites";
import { TopSites } from "@/components/TopSites";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Import } from "lucide-react";
import { toast } from "sonner";

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

  if (loading) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importFromFirefox(file);
      toast.success(`Imported ${count} sites from Firefox`);
    } catch {
      toast.error("Failed — select a Firefox prefs.js file");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-4xl">
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

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <ModeToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          title="Import from Firefox (prefs.js)"
        >
          <Import size={20} />
        </Button>
        <input ref={fileRef} type="file" accept=".js" onChange={handleImport} hidden />
      </div>
    </div>
  );
}

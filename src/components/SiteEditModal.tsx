import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave(title.trim(), url.trim());
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit shortcut" : "Add shortcut"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="site-title">Title</Label>
            <Input
              id="site-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="site-url">URL</Label>
            <Input
              id="site-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://google.com"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveFavicon } from "@/lib/favicons";
import { getColumnsCountFromElement } from "@/lib/grid";
import { Edit2, LayoutIcon, Plus } from "lucide-react";
import Link from "next/link";
import { DragEvent, useEffect, useRef, useState } from "react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  position?: number;
  row?: number;
  col?: number;
}

const defaultBookmarks: Bookmark[] = [
  { id: "1", title: "YouTube", url: "https://youtube.com", position: 0 },
  { id: "2", title: "Reddit", url: "https://reddit.com", position: 1 },
  { id: "3", title: "GitHub", url: "https://github.com", position: 2 },
  { id: "4", title: "Twitter", url: "https://twitter.com", position: 3 },
  { id: "5", title: "Gmail", url: "https://gmail.com", position: 4 },
  { id: "6", title: "Netflix", url: "https://netflix.com", position: 5 },
  { id: "7", title: "Amazon", url: "https://amazon.com", position: 6 },
  { id: "8", title: "Facebook", url: "https://facebook.com", position: 7 },
];

export default function NewTabPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(defaultBookmarks);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Load bookmarks from Chrome storage on mount
  useEffect(() => {
    const storageKey = "bookmarks";
    if (process.env.NODE_ENV === "development") {
      const storedBookmarks = localStorage.getItem(storageKey);
      if (storedBookmarks) {
        const parsed: Bookmark[] = JSON.parse(storedBookmarks);
        // Ensure positions exist; if not, assign by index
        const normalized = parsed.map((b, i) => ({
          ...b,
          position: typeof b.position === "number" ? b.position : i,
        }));
        setBookmarks(normalized);
        // Resolve favicons for loaded bookmarks
        JSON.parse(storedBookmarks).forEach((bookmark: Bookmark) => {
          if (!bookmark.favicon) {
            resolveFavicon(bookmark.url).then((icon) => {
              if (icon) {
                setBookmarks((prev) =>
                  prev.map((b) =>
                    b.id === bookmark.id ? { ...b, favicon: icon } : b,
                  ),
                );
              }
            });
          }
        });
      } else {
        // Set default bookmarks and fetch favicons
        localStorage.setItem(storageKey, JSON.stringify(defaultBookmarks));
        setBookmarks(defaultBookmarks);
        defaultBookmarks.forEach((bookmark) => {
          resolveFavicon(bookmark.url).then((icon) => {
            if (icon)
              setBookmarks((prev) =>
                prev.map((b) =>
                  b.id === bookmark.id ? { ...b, favicon: icon } : b,
                ),
              );
          });
        });
      }
    } else {
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey]) {
          const parsed: Bookmark[] = result[storageKey];
          const normalized = parsed.map((b: Bookmark, i: number) => ({
            ...b,
            position: typeof b.position === "number" ? b.position : i,
          }));
          setBookmarks(normalized);
          // Resolve favicons for loaded bookmarks
          normalized.forEach((bookmark: Bookmark) => {
            if (!bookmark.favicon) {
              resolveFavicon(bookmark.url).then((icon) => {
                if (icon)
                  setBookmarks((prev) =>
                    prev.map((b) =>
                      b.id === bookmark.id ? { ...b, favicon: icon } : b,
                    ),
                  );
              });
            }
          });
        } else {
          // Set default bookmarks and fetch favicons
          chrome.storage.local.set({ [storageKey]: defaultBookmarks });
          setBookmarks(defaultBookmarks);
          defaultBookmarks.forEach((bookmark) => {
            resolveFavicon(bookmark.url).then((icon) => {
              if (icon)
                setBookmarks((prev) =>
                  prev.map((b) =>
                    b.id === bookmark.id ? { ...b, favicon: icon } : b,
                  ),
                );
            });
          });
        }
      });
    }
  }, []);

  // Save bookmarks to Chrome storage whenever bookmarks change
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    } else {
      chrome.storage.local.set({ bookmarks }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving bookmarks:", chrome.runtime.lastError);
        }
      });
    }
  }, [bookmarks]);

  const getColumnsCount = () => getColumnsCountFromElement(gridRef.current, 8);

  const schema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", url: "" },
  });

  const handleSave = (data: FormValues) => {
    const titleValue = data.title;
    const urlValue = data.url || "";
    if (!titleValue || !urlValue) return;

    let formattedUrl = urlValue;
    if (!urlValue.startsWith("http://") && !urlValue.startsWith("https://")) {
      formattedUrl = "https://" + urlValue;
    }

    if (editingBookmark) {
      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.id === editingBookmark.id
            ? {
                ...bookmark,
                title: titleValue,
                url: formattedUrl,
                favicon: undefined,
              }
            : bookmark,
        ),
      );
      resolveFavicon(formattedUrl).then((icon) => {
        if (icon)
          setBookmarks((prev) =>
            prev.map((b) =>
              b.id === editingBookmark.id ? { ...b, favicon: icon } : b,
            ),
          );
      });
    } else {
      setBookmarks((prev) => {
        const columns = getColumnsCount();
        const pos = prev.length;
        const newBookmark: Bookmark = {
          id: Date.now().toString(),
          title: titleValue,
          url: formattedUrl,
          position: pos,
          row: Math.floor(pos / columns) + 1,
          col: (pos % columns) + 1,
        };
        resolveFavicon(formattedUrl).then((icon) => {
          if (icon)
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === newBookmark.id ? { ...b, favicon: icon } : b,
              ),
            );
        });
        return [...prev, newBookmark];
      });
    }

    form.reset();
    setEditingBookmark(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (bookmark: Bookmark) => {
    form.reset({ title: bookmark.title, url: bookmark.url });
    setEditingBookmark(bookmark);
    setIsDialogOpen(true);
  };

  const handleDelete = (bookmarkId: string) => {
    setBookmarks((prev) => {
      const columns = getColumnsCount();
      const filtered = prev.filter((bookmark) => bookmark.id !== bookmarkId);
      return filtered.map((b, i) => ({
        ...b,
        position: i,
        row: Math.floor(i / columns) + 1,
        col: (i % columns) + 1,
      }));
    });
    // Close dialog and clear editing state when deleting from the dialog
    setIsDialogOpen(false);
    setEditingBookmark(null);
  };

  // Navigation is handled by Next.js Link around each Card

  const handleDragStart = (e: DragEvent, bookmark: Bookmark) => {
    e.dataTransfer.setData("text/plain", bookmark.id);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, targetBookmark: Bookmark) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === targetBookmark.id) return;

    setBookmarks((prev) => {
      const columns = getColumnsCount();
      // build a map of position -> bookmark id
      const byPosition = new Map<number, Bookmark>();
      prev.forEach((b, i) => {
        const pos = typeof b.position === "number" ? b.position : i;
        byPosition.set(pos, b);
      });

      const source = prev.find((b) => b.id === sourceId);
      const target = prev.find((b) => b.id === targetBookmark.id);
      if (!source || !target) return prev;

      const sourcePos =
        typeof source.position === "number"
          ? source.position
          : prev.indexOf(source);
      const targetPos =
        typeof target.position === "number"
          ? target.position
          : prev.indexOf(target);

      // Swap positions to ensure uniqueness
      const newByPosition = new Map(byPosition);
      newByPosition.set(sourcePos, target);
      newByPosition.set(targetPos, source);

      // Convert map back to array and reassign positions (compact them in order of position keys)
      const maxPos = Math.max(...Array.from(newByPosition.keys()));
      const rebuilt: Bookmark[] = [];
      for (let pos = 0; pos <= maxPos; pos++) {
        const b = newByPosition.get(pos);
        if (b) {
          rebuilt.push({
            ...b,
            position: pos,
            row: Math.floor(pos / columns) + 1,
            col: (pos % columns) + 1,
          });
        }
      }

      // There might be bookmarks without positions (e.g., new ones); append them to the end
      prev.forEach((b) => {
        if (!Array.from(newByPosition.values()).find((v) => v.id === b.id)) {
          const pos = rebuilt.length;
          rebuilt.push({
            ...b,
            position: pos,
            row: Math.floor(pos / columns) + 1,
            col: (pos % columns) + 1,
          });
        }
      });

      return rebuilt;
    });
  };

  const handleDragEnd = (e: DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutIcon className="h-6 w-6 text-yellow-400" />
          <h1 className="text-2xl font-semibold">New Tab</h1>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingBookmark(null);
                  form.reset();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
                </DialogTitle>
                <DialogDescription id="dialog-description">
                  {editingBookmark
                    ? "Update your bookmark details below."
                    : "Add a new bookmark to your collection."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter bookmark title"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter URL (e.g., example.com)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-2">
                      <Button type="submit">
                        {editingBookmark ? "Update" : "Add"}
                      </Button>
                      {editingBookmark && (
                        <Button
                          onClick={() => handleDelete(editingBookmark.id)}
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        {/* Bookmarks Grid */}
        <div
          ref={gridRef}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-8"
        >
          {bookmarks
            .slice()
            .sort(
              (a, b) =>
                (typeof a.position === "number" ? a.position : 0) -
                (typeof b.position === "number" ? b.position : 0),
            )
            .map((bookmark) => (
              <div key={bookmark.id} className="group relative">
                <Link href={bookmark.url}>
                  <Card
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center p-4"
                    draggable
                    onDragStart={(e) => handleDragStart(e, bookmark)}
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={(e) => handleDrop(e, bookmark)}
                    onDragEnd={(e) => handleDragEnd(e)}
                  >
                    <div className="h-12 w-12 items-center justify-center">
                      {bookmark.favicon ? (
                        <img
                          src={bookmark.favicon || "/placeholder.svg"}
                          alt={bookmark.title}
                          className="h-12 w-12 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold ${
                          bookmark.favicon ? "hidden" : ""
                        }`}
                      >
                        {bookmark.title.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-center text-sm leading-tight font-medium">
                      ★ {bookmark.title}
                    </span>
                  </Card>
                </Link>

                {/* Edit button - appears on hover */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-border absolute -top-2 -right-2 h-6 w-6 cursor-pointer border p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bookmark);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-foreground/20 pointer-events-none mt-24 text-center text-sm select-none">
        <p>
          Click on any bookmark to open it • Hover over bookmarks to edit them •
          Favicons are automatically fetched • Drag and drop to reorder
        </p>
      </div>
    </div>
  );
}

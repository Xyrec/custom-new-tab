"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, LayoutIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

const defaultBookmarks: Bookmark[] = [
  { id: "1", title: "YouTube", url: "https://youtube.com" },
  { id: "2", title: "Reddit", url: "https://reddit.com" },
  { id: "3", title: "GitHub", url: "https://github.com" },
  { id: "4", title: "Twitter", url: "https://twitter.com" },
  { id: "5", title: "Gmail", url: "https://gmail.com" },
  { id: "6", title: "Netflix", url: "https://netflix.com" },
  { id: "7", title: "Amazon", url: "https://amazon.com" },
  { id: "8", title: "Facebook", url: "https://facebook.com" },
];

export default function NewTabPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(defaultBookmarks);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chrome-bookmarks");
    if (saved) {
      const parsedBookmarks = JSON.parse(saved);
      setBookmarks(parsedBookmarks);
      // Fetch favicons for loaded bookmarks
      parsedBookmarks.forEach((bookmark: Bookmark) => {
        if (!bookmark.favicon) {
          fetchFavicon(bookmark.url, bookmark.id);
        }
      });
    } else {
      // Fetch favicons for default bookmarks
      defaultBookmarks.forEach((bookmark) => {
        fetchFavicon(bookmark.url, bookmark.id);
      });
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    localStorage.setItem("chrome-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const fetchFavicon = async (url: string, bookmarkId: string) => {
    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.id === bookmarkId
            ? { ...bookmark, favicon: faviconUrl }
            : bookmark
        )
      );
    } catch (error) {
      console.error("Error fetching favicon:", error);
    }
  };

  const handleSave = () => {
    if (!title || !url) return;

    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = "https://" + url;
    }

    if (editingBookmark) {
      // Update existing bookmark
      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.id === editingBookmark.id
            ? { ...bookmark, title, url: formattedUrl, favicon: undefined }
            : bookmark
        )
      );
      fetchFavicon(formattedUrl, editingBookmark.id);
    } else {
      // Add new bookmark
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        title,
        url: formattedUrl,
      };
      setBookmarks((prev) => [...prev, newBookmark]);
      fetchFavicon(formattedUrl, newBookmark.id);
    }

    setTitle("");
    setUrl("");
    setEditingBookmark(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setIsDialogOpen(true);
  };

  const handleDelete = (bookmarkId: string) => {
    setBookmarks((prev) =>
      prev.filter((bookmark) => bookmark.id !== bookmarkId)
    );
  };

  const openBookmark = (url: string, event?: React.MouseEvent) => {
    if (event?.button === 1 || event?.ctrlKey || event?.metaKey) {
      // Middle click, Ctrl+click, or Cmd+click - open in new tab
      window.open(url, "_blank");
    } else {
      // Regular click - open in same tab
      window.open(url, "_self");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <LayoutIcon className="w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">New Tab</h1>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingBookmark(null);
                  setTitle("");
                  setUrl("");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
                </DialogTitle>
                <DialogDescription
                  id="dialog-description"
                  className="text-gray-400"
                >
                  {editingBookmark
                    ? "Update your bookmark details below."
                    : "Add a new bookmark to your collection."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter bookmark title"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="url" className="text-gray-300">
                    URL
                  </Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL (e.g., google.com)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bookmarks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="group relative">
              <Card
                className="bg-gray-800 border-gray-700 p-4 cursor-pointer hover:bg-gray-700 transition-colors aspect-square flex flex-col items-center justify-center"
                onClick={(e) => openBookmark(bookmark.url, e)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    openBookmark(bookmark.url, e);
                  }
                }}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    openBookmark(bookmark.url, e);
                  }
                }}
              >
                <div className="w-12 h-12 items-center justify-center">
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon || "/placeholder.svg"}
                      alt={bookmark.title}
                      className="w-12 h-12 rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                      bookmark.favicon ? "hidden" : ""
                    }`}
                  >
                    {bookmark.title.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-white text-sm text-center font-medium leading-tight">
                  ★ {bookmark.title}
                </span>
              </Card>

              {/* Edit button - appears on hover */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(bookmark);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Click on any bookmark to open it • Hover over bookmarks to edit them
            • Favicons are automatically fetched
          </p>
        </div>
      </div>
    </div>
  );
}

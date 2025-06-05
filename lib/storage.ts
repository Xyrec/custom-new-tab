export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface StorageResult {
  bookmarks?: Bookmark[];
}

export const storage = {
  async getBookmarks(): Promise<Bookmark[]> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["bookmarks"], (result: StorageResult) => {
        resolve(result.bookmarks || []);
      });
    });
  },

  async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ bookmarks }, () => {
        resolve();
      });
    });
  },

  async addBookmark(bookmark: Bookmark): Promise<void> {
    const bookmarks = await this.getBookmarks();
    bookmarks.push(bookmark);
    await this.saveBookmarks(bookmarks);
  },

  async removeBookmark(id: string): Promise<void> {
    const bookmarks = await this.getBookmarks();
    const filteredBookmarks = bookmarks.filter((b) => b.id !== id);
    await this.saveBookmarks(filteredBookmarks);
  },

  async updateBookmark(updatedBookmark: Bookmark): Promise<void> {
    const bookmarks = await this.getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === updatedBookmark.id);
    if (index !== -1) {
      bookmarks[index] = updatedBookmark;
      await this.saveBookmarks(bookmarks);
    }
  },
};

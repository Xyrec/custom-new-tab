/// <reference types="vite/client" />

declare namespace chrome {
  namespace topSites {
    interface MostVisitedURL {
      url: string;
      title: string;
    }
    function get(callback: (data: MostVisitedURL[]) => void): void;
    function get(): Promise<MostVisitedURL[]>;
  }
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    }
    const local: StorageArea;
  }
}

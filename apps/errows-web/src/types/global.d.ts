declare global {
  interface Window {
    import_meta_env: Record<string, string>;
  }
}

export {};

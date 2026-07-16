export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

export function applyTheme(theme: Theme) {
  if (theme === "system") {
    window.localStorage.removeItem(STORAGE_KEY);
    delete document.documentElement.dataset.theme;
  } else {
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }
}

/**
 * Inlined in the document head so the chosen theme applies
 * before first paint (no dark/light flash).
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

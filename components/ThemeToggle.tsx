"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const handleSelect = (value: Theme) => {
    setTheme(value);
    applyTheme(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-2">Appearance</span>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            className={`h-9 rounded-lg text-sm font-medium ${
              theme === value ? "bg-accent text-white" : "text-ink-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

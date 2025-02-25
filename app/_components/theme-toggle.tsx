"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/app/_components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Sun
        className={`ease-[cubic-bezier(0.34,1.56,0.64,1)] h-[1.2rem] w-[1.2rem] transition-all duration-700 ${
          theme === "dark"
            ? "rotate-12 scale-75 text-muted-foreground"
            : "rotate-0 scale-100 text-foreground"
        }`}
      />
      <Switch
        id="theme-toggle"
        aria-label="Toggle theme"
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="ease-[cubic-bezier(0.34,1.56,0.64,1)] transition-all duration-700 hover:scale-110"
      />
      <Moon
        className={`ease-[cubic-bezier(0.34,1.56,0.64,1)] h-[1.2rem] w-[1.2rem] transition-all duration-700 ${
          theme === "light"
            ? "rotate-12 scale-75 text-muted-foreground"
            : "rotate-0 scale-100 text-foreground"
        }`}
      />
    </div>
  );
}

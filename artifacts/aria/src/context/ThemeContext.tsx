import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Theme, type ThemeColors, THEMES, getStoredTheme, storeTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: THEMES.dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "purple") {
      root.classList.add("purple-theme");
    } else {
      root.classList.remove("purple-theme");
    }
    storeTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "purple" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, colors: THEMES[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

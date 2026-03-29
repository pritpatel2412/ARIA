export type Theme = "dark" | "purple";

export interface ThemeColors {
  primary: string;
  primaryRgb: string;
  secondary: string;
  secondaryRgb: string;
  bg: string;
  bgRgb: string;
  cardBg: string;
  border: string;
  borderMuted: string;
  navBgScrolled: string;
  navBgTop: string;
}

export const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    primary: "#00FF88",
    primaryRgb: "0,255,136",
    secondary: "#F59E0B",
    secondaryRgb: "245,158,11",
    bg: "#0A0A0F",
    bgRgb: "10,10,15",
    cardBg: "#0D0D14",
    border: "#1E1E2E",
    borderMuted: "#2A2A3A",
    navBgScrolled: "rgba(10,10,15,0.97)",
    navBgTop: "rgba(10,10,15,0.80)",
  },
  purple: {
    primary: "#A855F7",
    primaryRgb: "168,85,247",
    secondary: "#C084FC",
    secondaryRgb: "192,132,252",
    bg: "#080010",
    bgRgb: "8,0,16",
    cardBg: "#0E0018",
    border: "#1F0038",
    borderMuted: "#2D1050",
    navBgScrolled: "rgba(8,0,16,0.97)",
    navBgTop: "rgba(8,0,16,0.80)",
  },
};

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("aria-theme") as Theme) ?? "dark";
}

export function storeTheme(theme: Theme) {
  localStorage.setItem("aria-theme", theme);
}

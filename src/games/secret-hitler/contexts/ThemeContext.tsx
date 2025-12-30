import React, { createContext, useContext, useMemo } from "react";
import { ThemeId, ThemeAssets, ThemeLayout, ThemeLabels, getThemeAssets, getThemeLayout, getThemeLabels } from "../assets/themes";

interface ThemeContextValue {
  themeId: ThemeId;
  assets: ThemeAssets;
  layout: ThemeLayout;
  labels: ThemeLabels;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: "original",
  assets: getThemeAssets("original"),
  layout: getThemeLayout("original"),
  labels: getThemeLabels("original"),
});

interface ThemeProviderProps {
  themeId: ThemeId;
  children: React.ReactNode;
}

export function ThemeProvider({ themeId, children }: ThemeProviderProps) {
  const value = useMemo(
    () => ({
      themeId,
      assets: getThemeAssets(themeId),
      layout: getThemeLayout(themeId),
      labels: getThemeLabels(themeId),
    }),
    [themeId]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access current theme, assets, layout, and labels
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Hook to get a specific asset from current theme
 */
export function useAsset(assetKey: keyof ThemeAssets): string {
  const { assets } = useTheme();
  return assets[assetKey];
}

/**
 * Hook to get labels from current theme
 */
export function useLabels(): ThemeLabels {
  const { labels } = useTheme();
  return labels;
}

export default ThemeContext;

"use client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateThemePreset } from "@/lib/theme-utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { THEME_PRESET_OPTIONS, ThemePreset } from "@/types/preferences/theme";

export default function ThemeSwitcher({ label = true }: { label?: boolean }) {
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);

  const handleValueChange = (key: string, value: string | ThemePreset) => {
    if (key === "theme_preset") {
      const preset = value as ThemePreset;
      updateThemePreset(preset);
      setThemePreset(preset);
    }
  };

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs font-medium">Preset</Label>}
      <Select
        value={themePreset}
        onValueChange={(value) => handleValueChange("theme_preset", value)}
      >
        <SelectTrigger className="w-full text-xs">
          <SelectValue placeholder="Preset" />
        </SelectTrigger>
        <SelectContent>
          {THEME_PRESET_OPTIONS.map((preset) => (
            <SelectItem
              key={preset.value}
              className="text-xs"
              value={preset.value}
            >
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor:
                    themeMode === "dark"
                      ? preset.primary.dark
                      : preset.primary.light,
                }}
              />
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

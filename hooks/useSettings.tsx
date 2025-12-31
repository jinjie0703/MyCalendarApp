import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AppSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
  updateSettings as updateSettingsStorage,
} from "@/lib/settings";

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 初始加载设置
  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  // 更新设置
  const handleUpdateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = await updateSettingsStorage(patch);
      setSettings(updated);
    },
    []
  );

  // 重置设置
  const handleResetSettings = useCallback(async () => {
    await saveSettings(defaultSettings);
    setSettings(defaultSettings);
  }, []);

  // 重新加载设置
  const reloadSettings = useCallback(async () => {
    const loaded = await loadSettings();
    setSettings(loaded);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings: handleUpdateSettings,
        resetSettings: handleResetSettings,
        reloadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

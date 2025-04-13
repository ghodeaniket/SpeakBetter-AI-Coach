import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from './ProfileContext';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppSettings {
  themeMode: ThemeMode;
  fontSize: 'small' | 'medium' | 'large';
  useSystemVoice: boolean;
  hapticFeedback: boolean;
  autoPlayFeedback: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateThemeMode: (mode: ThemeMode) => Promise<void>;
  updateFontSize: (size: 'small' | 'medium' | 'large') => Promise<void>;
  toggleSystemVoice: () => Promise<void>;
  toggleHapticFeedback: () => Promise<void>;
  toggleAutoPlayFeedback: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  themeMode: 'system',
  fontSize: 'medium',
  useSystemVoice: false,
  hapticFeedback: true,
  autoPlayFeedback: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const { userProfile } = useProfile();
  
  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const storedSettings = await AsyncStorage.getItem('app_settings');
        
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to storage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };
    
    if (!loading) {
      saveSettings();
    }
  }, [settings, loading]);
  
  const updateThemeMode = async (mode: ThemeMode) => {
    setSettings(prev => ({ ...prev, themeMode: mode }));
  };
  
  const updateFontSize = async (size: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };
  
  const toggleSystemVoice = async () => {
    setSettings(prev => ({ ...prev, useSystemVoice: !prev.useSystemVoice }));
  };
  
  const toggleHapticFeedback = async () => {
    setSettings(prev => ({ ...prev, hapticFeedback: !prev.hapticFeedback }));
  };
  
  const toggleAutoPlayFeedback = async () => {
    setSettings(prev => ({ ...prev, autoPlayFeedback: !prev.autoPlayFeedback }));
  };
  
  const resetSettings = async () => {
    setSettings(defaultSettings);
  };
  
  const value = {
    settings,
    loading,
    updateThemeMode,
    updateFontSize,
    toggleSystemVoice,
    toggleHapticFeedback,
    toggleAutoPlayFeedback,
    resetSettings
  };
  
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
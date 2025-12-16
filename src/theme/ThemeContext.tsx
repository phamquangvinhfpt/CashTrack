import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme } from './index';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cashtrack_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isInitialized, setIsInitialized] = useState(false);

    // Determine if dark mode based on themeMode and system preference
    const isDark = themeMode === 'system'
        ? systemColorScheme === 'dark'
        : themeMode === 'dark';

    const theme = isDark ? darkTheme : lightTheme;

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setThemeModeState(savedMode as ThemeMode);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            } finally {
                setIsInitialized(true);
            }
        };
        loadTheme();
    }, []);

    // Save theme preference
    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            setThemeModeState(mode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, []);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        const newMode = isDark ? 'light' : 'dark';
        setThemeMode(newMode);
    }, [isDark, setThemeMode]);

    // Update status bar based on theme
    useEffect(() => {
        StatusBar.setBarStyle(theme.statusBar);
    }, [theme.statusBar]);

    if (!isInitialized) {
        return null; // Or a loading screen
    }

    return (
        <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook for creating themed styles
export const useThemedStyles = <T extends Record<string, any>>(
    styleCreator: (theme: Theme) => T
): T => {
    const { theme } = useTheme();
    return React.useMemo(() => styleCreator(theme), [theme, styleCreator]);
};

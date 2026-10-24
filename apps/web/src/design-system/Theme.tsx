import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from './cn';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'alegon_ui_theme';

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
};

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'compact' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'button',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 p-1 bg-secondary rounded-lg border border-border text-muted-foreground',
          className
        )}
        role="group"
        aria-label="Alternador de tema visual"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
            theme === 'light'
              ? 'bg-card text-foreground shadow-xs'
              : 'hover:text-foreground'
          )}
          aria-pressed={theme === 'light'}
          aria-label="Modo Claro"
        >
          <Sun className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Claro</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
            theme === 'dark'
              ? 'bg-card text-foreground shadow-xs'
              : 'hover:text-foreground'
          )}
          aria-pressed={theme === 'dark'}
          aria-label="Modo Escuro"
        >
          <Moon className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Escuro</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
            theme === 'system'
              ? 'bg-card text-foreground shadow-xs'
              : 'hover:text-foreground'
          )}
          aria-pressed={theme === 'system'}
          aria-label="Seguir Sistema"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Auto</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      aria-label={`Alternar tema. Tema atual: ${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'}`}
      title={`Alternar tema (atualmente ${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'})`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-warning" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
    </button>
  );
};

'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAppTheme } from '@/theme/theme';

type ColorModeContextType = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | null>(null);

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within AppProviders');
  }
  return context;
};

const queryClient = new QueryClient();

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('dark');

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colorModeValue = useMemo(() => ({ mode, toggleMode }), [mode]);
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </ColorModeContext.Provider>
  );
}

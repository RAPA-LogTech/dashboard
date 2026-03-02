'use client';

import React, { useState } from 'react';
import { Box, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import GlobalFilterBar from './GlobalFilterBar';
import AiChatDrawer from '../chat/AiChatDrawer';
import { GlobalFilterState } from '@/lib/types';
import { defaultGlobalFilter } from '@/lib/mock';

interface AppLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 280;

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<GlobalFilterState>(defaultGlobalFilter);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Top App Bar - Fixed at top */}
      <TopBar 
        onMenuClick={handleDrawerToggle}
        showMenuButton={isMobile}
      />

      {/* Sidebar - Permanent on desktop */}
      <Sidebar 
        onOpenAiChat={() => setAiChatOpen(true)} 
        variant={isMobile ? 'temporary' : 'permanent'}
        openMobile={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          ml: { xs: 0, md: `${drawerWidth}px` },
          minHeight: '100vh',
        }}
      >
        {/* Global Filter Bar */}
        <GlobalFilterBar value={filters} onChange={setFilters} />

        {/* Scrollable Content Area */}
        <Container
          maxWidth="lg"
          sx={{
            py: 3,
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {children}
        </Container>
      </Box>

      {/* AI Chat Drawer */}
      <AiChatDrawer open={aiChatOpen} onClose={() => setAiChatOpen(false)} filters={filters} />
    </Box>
  );
}


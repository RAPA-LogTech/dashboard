'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Chip,
  Box,
  ListItemText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
} from '@mui/icons-material';
import { useColorMode } from '@/app/providers';
import { apiClient } from '@/lib/apiClient';
import { formatTimestamp } from '@/lib/formatters';

const drawerWidth = 280;
const topBarHeight = 48;

interface TopBarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const router = useRouter();
  const { mode, toggleMode } = useColorMode();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications'],
    queryFn: apiClient.getNotifications,
  });
  const [notificationReadMap, setNotificationReadMap] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    setNotificationReadMap((prev) => {
      const next = { ...prev };
      for (const notification of notifications) {
        if (next[notification.id] === undefined) {
          next[notification.id] = notification.read;
        }
      }
      return next;
    });
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !notificationReadMap[item.id]).length;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
    setShowUserMenu(true);
  };

  const handleMenuClose = () => {
    setUserAnchorEl(null);
    setShowUserMenu(false);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = (notificationId: string, route?: string) => {
    setNotificationReadMap((prev) => ({
      ...prev,
      [notificationId]: true,
    }));
    handleNotificationMenuClose();

    if (route) {
      router.push(route);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        height: `${topBarHeight}px`,
        width: '100%',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        color: (theme) => theme.palette.text.primary,
        borderBottom: '1px solid',
        borderColor: (theme) => theme.palette.divider,
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${topBarHeight}px !important`,
          height: `${topBarHeight}px`,
          display: 'flex',
          justifyContent: 'space-between',
          py: 1,
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Mobile Menu Button */}
        {showMenuButton && (
          <Tooltip title="Menu">
            <IconButton
              onClick={onMenuClick}
              size="small"
              sx={{
                color: (theme) => theme.palette.text.secondary,
                '&:hover': {
                  color: (theme) => theme.palette.text.primary,
                },
                mr: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Left */}
        <Box
          component={Link}
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 700, 
                color: (theme) => theme.palette.text.primary,
                lineHeight: 1,
              }}
            >
              LogTech
            </Typography>
          </Box>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: (theme) => theme.palette.success.main,
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5 } }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                color: (theme) => theme.palette.text.secondary,
                '&:hover': {
                  color: (theme) => theme.palette.text.primary,
                },
              }}
            >
              <Brightness4Icon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={handleNotificationMenuOpen}
              sx={{
                color: (theme) => theme.palette.text.secondary,
                '&:hover': {
                  color: (theme) => theme.palette.text.primary,
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            PaperProps={{
              sx: {
                bgcolor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.text.primary,
                mt: 1,
                width: 320,
                maxHeight: 360,
              },
            }}
          >
            {notifications.length === 0 ? (
              <MenuItem disabled>No notifications</MenuItem>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationItemClick(notification.id, notification.route)}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1,
                    cursor: notification.route ? 'pointer' : 'default',
                    borderLeft: '3px solid',
                    borderLeftColor: (theme) => {
                      if (notification.severity === 'critical' || notification.severity === 'error') {
                        return theme.palette.error.main;
                      }
                      if (notification.severity === 'warning') {
                        return theme.palette.warning.main;
                      }
                      return theme.palette.info.main;
                    },
                    bgcolor: (theme) =>
                      notificationReadMap[notification.id] ? 'transparent' : theme.palette.action.hover,
                  }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={`${notification.message} • ${formatTimestamp(notification.timestamp)}`}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: notificationReadMap[notification.id] ? 500 : 700,
                      color: 'text.primary',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                    }}
                  />
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                color: (theme) => theme.palette.text.secondary,
                '&:hover': {
                  color: (theme) => theme.palette.text.primary,
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={userAnchorEl}
            open={showUserMenu}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.text.primary,
                mt: 1,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                fontSize: '0.75rem',
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              sre@company.com
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              sx={{
                color: '#ff6b6b',
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}


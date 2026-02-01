import type { Theme } from "@mui/material/styles";
import { alpha } from '@mui/material/styles';
import type { SxProps } from '@mui/system';

// Reusable style fragments keyed by semantic role.
// All styles reference the MUI theme so they work in both light and dark mode.

export const accent = (theme: Theme) =>
  theme.palette.mode === 'dark' ? '#6366f1' : '#4f46e5';

export const accentGradient = (theme: Theme) =>
  theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

export const mono = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace";

export const containerSx = (height: string | number): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  height,
  overflow: 'hidden',
  bgcolor: 'background.default',
  color: 'text.primary',
});

export const headerSx: SxProps<Theme> = {
  px: 2.5,
  py: 1.5,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper',
};

export const sidebarSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRight: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper',
};

export const fieldCardSx = (selected: boolean): SxProps<Theme> => (theme) => ({
  p: 1.5,
  mb: 1,
  cursor: 'pointer',
  borderRadius: 1.5,
  border: 1,
  borderColor: selected ? accent(theme) : 'divider',
  bgcolor: selected
    ? alpha(accent(theme), 0.04)
    : theme.palette.mode === 'dark'
      ? 'grey.900'
      : 'grey.50',
  transition: 'all 0.15s ease',
  '&:hover': {
    borderColor: selected ? accent(theme) : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.400',
    transform: 'translateY(-1px)',
  },
});

export const badgeSx = (variant: 'long' | 'vars'): SxProps<Theme> => (theme) => ({
  fontSize: 9,
  px: 1,
  py: 0.25,
  borderRadius: 1.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  ...(variant === 'long'
    ? { bgcolor: alpha('#fbbf24', 0.12), color: '#fbbf24' }
    : { bgcolor: alpha(accent(theme), 0.12), color: theme.palette.mode === 'dark' ? '#a78bfa' : '#7c3aed' }),
});

export const placeholderChipSx: SxProps<Theme> = (theme) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  bgcolor: alpha(accent(theme as Theme), 0.08),
  border: 1,
  borderColor: alpha(accent(theme as Theme), 0.25),
  borderRadius: 0.75,
  px: 1,
  mx: 0.25,
  fontFamily: mono,
  fontSize: 11,
  color: (theme as Theme).palette.mode === 'dark' ? '#a78bfa' : '#6d28d9',
  whiteSpace: 'nowrap',
});

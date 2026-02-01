import { useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import { JsonConfigEditor } from './components/JsonConfigEditor';

const sampleConfig = {
  method: 'POST',
  url: '/api/webhook',
  timeout: '30s',
  retryPolicy: 'exponential',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer :::auth.token',
    'X-Request-ID': ':::request.id',
  },
  body: {
    message:
      "Hello :::user.firstName! Your order #:::order.id has been confirmed. We'll deliver to :::user.address.street, :::user.address.city by :::delivery.estimatedDate.",
    subject: 'Order Confirmation',
    specialChars: "Quotes: 'single' and \"double\". Symbols: @#$%^&*()",
    footer: 'This is an automated message. Please do not reply directly.',
    metadata: {
      timestamp: ':::system.currentTime',
      source: 'webhook-service',
      version: '2.1.0',
      nested: {
        level3: {
          deepValue: 'Deeply nested string at level 3',
          anotherDeep: 'Another :::deep.placeholder here',
        },
      },
    },
    recipients: [
      { name: 'Primary', email: ':::recipient.primary.email' },
      { name: 'CC', email: ':::recipient.cc.email' },
    ],
  },
  errorHandling: {
    fallbackMessage: 'We encountered an issue. Please try again later.',
    notifyEmail: 'alerts@example.com',
    escalation: {
      level1: {
        contact: 'support@example.com',
        message: 'Level 1 escalation for :::error.code',
      },
      level2: {
        contact: 'engineering@example.com',
        message: 'Critical: :::error.details requires immediate attention',
      },
    },
  },
};

function App() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode },
        typography: {
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Floating theme toggle */}
      <Box sx={{ position: 'fixed', top: 8, right: 8, zIndex: 9999 }}>
        <IconButton
          size="small"
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Box>

      <JsonConfigEditor
        initialValue={sampleConfig}
        onChange={(config) => console.log('[onChange]', config)}
        title="Trading Config Editor"
        height="100vh"
      />
    </ThemeProvider>
  );
}

export default App;

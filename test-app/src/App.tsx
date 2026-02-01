import { useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import { JsonConfigEditor } from './components/JsonConfigEditor';

// Context uses the nested { data: { ... }, lastUpdatedAt, lastUpdateFrom } shape.
// Placeholders reference paths WITHOUT the "data" key:
//   :::auth.token  →  sampleContext.auth.data.token
//   :::user.firstName  →  sampleContext.user.data.firstName
const sampleContext = {
  auth: {
    data: { token: 'eyJhbGciOiJIUzI1NiJ9...' },
    lastUpdatedAt: '2026-01-30T08:00:00Z',
    lastUpdateFrom: 'login-service',
  },
  request: {
    data: { id: 'req-7f3a-b82c' },
    lastUpdatedAt: '2026-02-01T10:29:00Z',
    lastUpdateFrom: 'gateway',
  },
  user: {
    data: {
      firstName: 'Andrea',
      name: 'Andrea D.',
      email: 'andrea@example.com',
      address: { street: '123 Main St', city: 'Milan' },
    },
    lastUpdatedAt: '2026-01-28T14:00:00Z',
    lastUpdateFrom: 'profile-service',
  },
  order: {
    data: { id: 'ORD-44821' },
    lastUpdatedAt: '2026-02-01T09:15:00Z',
    lastUpdateFrom: 'order-service',
  },
  delivery: {
    data: { estimatedDate: '2026-02-05' },
    lastUpdatedAt: '2026-02-01T09:20:00Z',
    lastUpdateFrom: 'logistics',
  },
  system: {
    data: { currentTime: '2026-02-01T10:30:00Z', date: '2026-02-01' },
    lastUpdatedAt: '2026-02-01T10:30:00Z',
    lastUpdateFrom: 'system-clock',
  },
  recipient: {
    data: {
      primary: { email: 'primary@example.com' },
      cc: { email: 'cc@example.com' },
    },
    lastUpdatedAt: '2026-01-25T12:00:00Z',
    lastUpdateFrom: 'contact-service',
  },
  deep: {
    data: { placeholder: 'resolved-deep-value' },
    lastUpdatedAt: '2026-01-20T10:00:00Z',
    lastUpdateFrom: 'deep-service',
  },
  error: {
    data: { code: 'E-5001', details: 'Connection timeout on node-3' },
    lastUpdatedAt: '2026-02-01T10:28:00Z',
    lastUpdateFrom: 'error-handler',
  },
  instruments: {
    data: ['AAPL', 'MSFT', 'GOOG', 'AMZN'],
    lastUpdatedAt: '2026-02-01T10:00:00Z',
    lastUpdateFrom: 'market-feed',
  },
  prices: {
    data: [142.5, 338.2, 175.8, 185.1],
    lastUpdatedAt: '2026-02-01T10:00:00Z',
    lastUpdateFrom: 'market-feed',
  },
};

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
    watchlist: 'Current instruments: :::instruments|newline at prices :::prices|custom(; )',
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
        onSave={(config) => console.log('[onSave]', config)}
        title="JSON Editor"
        height="100vh"
        placeholderContext={sampleContext}
      />
    </ThemeProvider>
  );
}

export default App;

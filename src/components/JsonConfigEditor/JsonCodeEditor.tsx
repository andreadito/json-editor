import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#fafafa',
    fontSize: '13px',
  },
  '.cm-gutters': {
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e0e0e0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8e8e8',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0f0',
  },
});

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0c0c0e',
    fontSize: '13px',
  },
  '.cm-gutters': {
    backgroundColor: '#0c0c0e',
    borderRight: '1px solid #1a1a1f',
    color: '#404048',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#141418',
  },
  '.cm-activeLine': {
    backgroundColor: '#111115',
  },
});

const baseExtensions = [
  json(),
  EditorView.lineWrapping,
];

const JsonCodeEditor: React.FC<Props> = ({ value, onChange, hasError }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const extensions = React.useMemo(
    () => [...baseExtensions, isDark ? darkTheme : lightTheme],
    [isDark],
  );

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        borderLeft: hasError ? 3 : 0,
        borderColor: 'error.main',
        '& .cm-editor': { height: '100%' },
        '& .cm-scroller': { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        theme={isDark ? oneDark : 'light'}
        extensions={extensions}
        onChange={handleChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          tabSize: 2,
        }}
      />
    </Box>
  );
};

export default React.memo(JsonCodeEditor);

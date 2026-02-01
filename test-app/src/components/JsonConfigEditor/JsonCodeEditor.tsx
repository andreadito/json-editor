import React, { useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import {
  EditorView,
  Decoration,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import type { EditableField } from './types';

// ── Styles for clickable keys ────────────────────────────────────────────

const clickableKeyTheme = EditorView.baseTheme({
  '.cm-clickable-key': {
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '3px',
    borderRadius: '3px',
    transition: 'all 0.15s ease',
  },
  '.cm-clickable-key:hover': {
    textDecorationStyle: 'solid',
    textDecorationColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
});

// ── Decoration mark ──────────────────────────────────────────────────────

const clickableMark = (path: string) =>
  Decoration.mark({
    class: 'cm-clickable-key',
    attributes: { 'data-field-path': path },
  });

// ── Find key positions in JSON text ──────────────────────────────────────

interface KeyPosition {
  from: number; // start of the `"key"` token (including quote)
  to: number;   // end of the `"key"` token (including quote)
  path: string;
}

function findKeyPositions(text: string, fields: EditableField[]): KeyPosition[] {
  const positions: KeyPosition[] = [];
  // Build a lookup: for each field, we need to find "key"\s*: in the text
  // at the right nesting depth. We use a simple approach: track the JSON
  // structure line by line using brace/bracket counting.

  // Build a set of paths we care about
  const pathSet = new Set(fields.map((f) => f.path));

  // Walk through the JSON text tracking the current path
  const pathStack: (string | number)[] = [];
  const stateStack: ('object' | 'array')[] = [];
  let i = 0;
  const len = text.length;

  const currentPath = () => pathStack.join('.');

  const skipWhitespace = () => {
    while (i < len && /\s/.test(text[i])) i++;
  };

  const readString = (): { str: string; from: number; to: number } | null => {
    if (i >= len || text[i] !== '"') return null;
    const from = i;
    i++; // skip opening "
    let result = '';
    while (i < len && text[i] !== '"') {
      if (text[i] === '\\') {
        i++;
        if (i < len) {
          result += text[i];
          i++;
        }
      } else {
        result += text[i];
        i++;
      }
    }
    if (i < len) i++; // skip closing "
    return { str: result, from, to: i };
  };

  const skipValue = () => {
    skipWhitespace();
    if (i >= len) return;
    if (text[i] === '"') {
      readString();
    } else if (text[i] === '{') {
      parseObject();
    } else if (text[i] === '[') {
      parseArray();
    } else {
      // number, bool, null — skip until delimiter
      while (i < len && !/[,\}\]\s]/.test(text[i])) i++;
    }
  };

  const parseObject = () => {
    i++; // skip {
    skipWhitespace();
    while (i < len && text[i] !== '}') {
      skipWhitespace();
      if (text[i] === '}') break;

      // Read key
      const keyToken = readString();
      if (!keyToken) { i++; continue; }

      skipWhitespace();
      if (i < len && text[i] === ':') i++; // skip :
      skipWhitespace();

      pathStack.push(keyToken.str);
      const path = currentPath();

      // Check if this key points to a string value and is in our set
      if (pathSet.has(path) && i < len && text[i] === '"') {
        positions.push({ from: keyToken.from, to: keyToken.to, path });
      }

      stateStack.push('object');
      skipValue();
      stateStack.pop();
      pathStack.pop();

      skipWhitespace();
      if (i < len && text[i] === ',') i++;
    }
    if (i < len) i++; // skip }
  };

  const parseArray = () => {
    i++; // skip [
    let index = 0;
    skipWhitespace();
    while (i < len && text[i] !== ']') {
      skipWhitespace();
      if (text[i] === ']') break;

      pathStack.push(index);

      stateStack.push('array');
      skipValue();
      stateStack.pop();
      pathStack.pop();

      index++;
      skipWhitespace();
      if (i < len && text[i] === ',') i++;
    }
    if (i < len) i++; // skip ]
  };

  skipWhitespace();
  if (i < len) {
    if (text[i] === '{') parseObject();
    else if (text[i] === '[') parseArray();
  }

  return positions;
}

// ── CM6 ViewPlugin that builds decorations ───────────────────────────────

function makeClickableKeysPlugin(fieldsRef: React.RefObject<EditableField[]>) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const fields = fieldsRef.current;
        if (!fields || fields.length === 0) return Decoration.none;

        const text = view.state.doc.toString();
        const positions = findKeyPositions(text, fields);

        if (positions.length === 0) return Decoration.none;

        // Decorations must be added in document order
        positions.sort((a, b) => a.from - b.from);

        const builder = new RangeSetBuilder<Decoration>();
        for (const pos of positions) {
          builder.add(pos.from, pos.to, clickableMark(pos.path));
        }
        return builder.finish();
      }
    },
    { decorations: (v) => v.decorations },
  );
}

// ── Click handler extension ──────────────────────────────────────────────

function makeClickHandler(onFieldClick: ((path: string) => void) | undefined) {
  return EditorView.domEventHandlers({
    click(event: MouseEvent) {
      if (!onFieldClick) return false;
      const target = event.target as HTMLElement;
      const clickable = target.closest('.cm-clickable-key') as HTMLElement | null;
      if (clickable) {
        const path = clickable.getAttribute('data-field-path');
        if (path) {
          event.preventDefault();
          event.stopPropagation();
          onFieldClick(path);
          return true;
        }
      }
      return false;
    },
  });
}

// ── Component themes ─────────────────────────────────────────────────────

const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#fafafa', fontSize: '13px' },
  '.cm-gutters': { backgroundColor: '#fafafa', borderRight: '1px solid #e0e0e0' },
  '.cm-activeLineGutter': { backgroundColor: '#e8e8e8' },
  '.cm-activeLine': { backgroundColor: '#f0f0f0' },
});

const darkTheme = EditorView.theme({
  '&': { backgroundColor: '#0c0c0e', fontSize: '13px' },
  '.cm-gutters': { backgroundColor: '#0c0c0e', borderRight: '1px solid #1a1a1f', color: '#404048' },
  '.cm-activeLineGutter': { backgroundColor: '#141418' },
  '.cm-activeLine': { backgroundColor: '#111115' },
});

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  editableFields?: EditableField[];
  onFieldClick?: (path: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────

const JsonCodeEditor: React.FC<Props> = ({ value, onChange, hasError, editableFields, onFieldClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fieldsRef = useRef<EditableField[]>(editableFields ?? []);

  // Keep ref in sync (avoids recreating extensions on every fields change)
  fieldsRef.current = editableFields ?? [];

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  // Build extensions — only recreate when theme or onFieldClick identity changes
  const extensions = useMemo<Extension[]>(() => {
    return [
      json(),
      EditorView.lineWrapping,
      isDark ? darkTheme : lightTheme,
      clickableKeyTheme,
      makeClickableKeysPlugin(fieldsRef),
      makeClickHandler(onFieldClick),
    ];
  }, [isDark, onFieldClick]);

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

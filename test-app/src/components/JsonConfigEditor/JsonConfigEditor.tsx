import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DataObjectIcon from '@mui/icons-material/DataObject';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { alpha, useTheme } from '@mui/material/styles';

import type { JsonConfigEditorProps, EditableField, FieldFilter } from './types';
import { findEditableFields, setValueAtPath } from './utils';
import { accent, accentGradient, containerSx, headerSx, sidebarSx, mono } from './theme';
import FieldCard from './FieldCard';
import JsonCodeEditor from './JsonCodeEditor';
import TextFieldEditor from './TextFieldEditor';
import OutputModal from './OutputModal';

const DEFAULT_PLACEHOLDER_REGEX = /:::([\w.]+)/g;

const JsonConfigEditor: React.FC<JsonConfigEditorProps> = ({
  initialValue,
  onChange,
  onExport,
  placeholderPattern = DEFAULT_PLACEHOLDER_REGEX,
  quickPlaceholders,
  title = 'JSON Config Editor',
  height = '100vh',
}) => {
  const theme = useTheme();
  const [config, setConfig] = useState<Record<string, unknown>>(initialValue);
  const [selectedField, setSelectedField] = useState<EditableField | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [filter, setFilter] = useState<FieldFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(initialValue, null, 2));

  // Track whether a config change came from the code editor (don't reformat)
  // vs. from the field editor / reset (do reformat and push into CodeMirror)
  const changeFromCodeEditor = useRef(false);

  const editableFields = useMemo(() => findEditableFields(config, '', placeholderPattern), [config, placeholderPattern]);

  const filteredFields = useMemo(() => {
    let fields = editableFields;
    if (filter === 'placeholders') fields = fields.filter((f) => f.hasPlaceholders);
    else if (filter === 'long') fields = fields.filter((f) => f.isLong);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      fields = fields.filter(
        (f) =>
          f.key.toLowerCase().includes(q) ||
          f.path.toLowerCase().includes(q) ||
          f.value.toLowerCase().includes(q),
      );
    }
    return fields;
  }, [editableFields, filter, searchQuery]);

  const fieldCounts = useMemo(
    () => ({
      all: editableFields.length,
      placeholders: editableFields.filter((f) => f.hasPlaceholders).length,
      long: editableFields.filter((f) => f.isLong).length,
    }),
    [editableFields],
  );

  // Only push formatted JSON back into CodeMirror when the change came
  // from the field editor panel or a reset — NOT from the code editor itself.
  useEffect(() => {
    if (changeFromCodeEditor.current) {
      changeFromCodeEditor.current = false;
      return;
    }
    setJsonText(JSON.stringify(config, null, 2));
    setJsonError(null);
  }, [config]);

  // Notify parent
  useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);

  const handleJsonChange = useCallback((text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      changeFromCodeEditor.current = true;
      setConfig(parsed);
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, []);

  const handleFieldSave = useCallback(
    (newValue: string) => {
      if (selectedField) {
        // This comes from the field editor — let the effect reformat
        setConfig((prev) => setValueAtPath(prev, selectedField.path, newValue));
      }
    },
    [selectedField],
  );

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(JSON.stringify(config));
    } else {
      setShowOutput(true);
    }
  }, [config, onExport]);

  const handleReset = useCallback(() => {
    // This comes from the reset button — let the effect reformat
    setConfig(initialValue);
    setSelectedField(null);
  }, [initialValue]);

  const filterTabs: { key: FieldFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: fieldCounts.all },
    { key: 'placeholders', label: 'Vars', count: fieldCounts.placeholders },
    { key: 'long', label: 'Long', count: fieldCounts.long },
  ];

  return (
    <Box sx={containerSx(height)}>
      {/* Header */}
      <Box sx={headerSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              background: accentGradient(theme),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {'{ }'}
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{title}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RestartAltIcon sx={{ fontSize: '16px !important' }} />}
            onClick={handleReset}
            sx={{ textTransform: 'none', fontSize: 12 }}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<DataObjectIcon sx={{ fontSize: '16px !important' }} />}
            onClick={handleExport}
            sx={{ textTransform: 'none', fontSize: 12, background: accentGradient(theme) }}
          >
            Get Output
          </Button>
        </Box>
      </Box>

      {/* 3-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '280px 1fr 360px', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={sidebarSx}>
          {/* Sidebar header */}
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography
              variant="overline"
              sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: accent(theme) }}
            >
              String Fields
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              {editableFields.length} editable field{editableFields.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Search */}
          <Box sx={{ px: 1.5, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { fontSize: 12 },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          </Box>

          {/* Filter tabs */}
          <Box sx={{ display: 'flex', px: 1.5, pb: 1, gap: 0.5 }}>
            {filterTabs.map((tab) => (
              <Chip
                key={tab.key}
                label={`${tab.label} (${tab.count})`}
                size="small"
                variant={filter === tab.key ? 'filled' : 'outlined'}
                onClick={() => setFilter(tab.key)}
                sx={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: 500,
                  height: 28,
                  borderRadius: 1,
                  ...(filter === tab.key && {
                    bgcolor: alpha(accent(theme), 0.12),
                    color: theme.palette.mode === 'dark' ? '#a78bfa' : '#6d28d9',
                    borderColor: alpha(accent(theme), 0.25),
                  }),
                }}
              />
            ))}
          </Box>

          {/* Field list */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
            {filteredFields.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 5, color: 'text.disabled', fontSize: 12 }}>
                {searchQuery ? `No fields match "${searchQuery}"` : 'No fields match this filter'}
              </Typography>
            ) : (
              filteredFields.map((field) => (
                <FieldCard
                  key={field.path}
                  field={field}
                  selected={selectedField?.path === field.path}
                  pattern={placeholderPattern}
                  onClick={() => setSelectedField(field)}
                />
              ))
            )}
          </Box>
        </Box>

        {/* Central JSON editor */}
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
          {/* Editor header */}
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                JSON Configuration
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>
                Click underlined keys to edit
              </Typography>
            </Box>
            <Chip
              label={jsonError ? 'Invalid JSON' : 'Valid JSON'}
              size="small"
              sx={{
                fontSize: 10,
                height: 22,
                fontFamily: mono,
                fontWeight: 600,
                bgcolor: jsonError ? alpha('#ef4444', 0.12) : alpha('#10b981', 0.12),
                color: jsonError ? '#ef4444' : '#10b981',
              }}
            />
          </Box>

          {/* Error bar */}
          {jsonError && (
            <Box
              sx={{
                bgcolor: alpha('#ef4444', 0.06),
                borderBottom: 1,
                borderColor: alpha('#ef4444', 0.2),
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 14 }}>⚠</Typography>
              <Typography sx={{ fontFamily: mono, fontSize: 11, color: '#ef4444' }}>{jsonError}</Typography>
            </Box>
          )}

          {/* Code editor */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <JsonCodeEditor
              value={jsonText}
              onChange={handleJsonChange}
              hasError={!!jsonError}
              editableFields={editableFields}
              onFieldClick={(path) => {
                const field = editableFields.find((f) => f.path === path);
                if (field) setSelectedField(field);
              }}
            />
          </Box>
        </Box>

        {/* Right panel - field editor */}
        <Box sx={{ borderLeft: 1, borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
          {selectedField ? (
            <TextFieldEditor
              key={selectedField.path}
              path={selectedField.path}
              value={editableFields.find((f) => f.path === selectedField.path)?.value ?? selectedField.value}
              onSave={handleFieldSave}
              onCancel={() => setSelectedField(null)}
              pattern={placeholderPattern}
              quickPlaceholders={quickPlaceholders}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                px: 4,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <EditNoteIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
              </Box>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
                No field selected
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.6 }}>
                Click a field in the sidebar or an underlined key in the JSON editor to open it here
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Output modal */}
      <OutputModal open={showOutput} config={config} onClose={() => setShowOutput(false)} />
    </Box>
  );
};

export default JsonConfigEditor;

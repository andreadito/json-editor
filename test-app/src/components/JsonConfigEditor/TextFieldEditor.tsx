import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import PlaceholderHighlighter from './PlaceholderHighlighter';
import { getPlaceholdersFromText } from './utils';
import { accent, accentGradient, mono } from './theme';

interface Props {
  path: string;
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  pattern?: RegExp;
  quickPlaceholders?: string[];
}

const TextFieldEditor: React.FC<Props> = ({
  path,
  value,
  onSave,
  onCancel,
  pattern = /:::([\w.]+)/g,
  quickPlaceholders = ['user.name', 'user.email', 'data.id', 'system.date'],
}) => {
  const theme = useTheme();
  const [editValue, setEditValue] = useState(value);
  const [showPreview, setShowPreview] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setEditValue(value);
    setJustSaved(false);
  }, [path, value]);

  const hasChanges = editValue !== value;

  const handleSave = useCallback(() => {
    onSave(editValue);
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [editValue, onSave]);

  const placeholders = useMemo(() => getPlaceholdersFromText(editValue, pattern), [editValue, pattern]);

  const insertPlaceholder = useCallback((name: string) => {
    setEditValue((prev) => prev + `:::${name}`);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0.75,
              background: accentGradient(theme),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            ✎
          </Box>
          <Typography
            noWrap
            sx={{ fontFamily: mono, fontSize: 12, color: theme.palette.mode === 'dark' ? '#a78bfa' : '#6d28d9' }}
          >
            {path}
          </Typography>
          {hasChanges && (
            <Chip label="Unsaved" size="small" sx={{ bgcolor: alpha('#f59e0b', 0.12), color: '#f59e0b', fontSize: 10, height: 20, fontWeight: 600 }} />
          )}
          {justSaved && !hasChanges && (
            <Chip label="✓ Saved" size="small" sx={{ bgcolor: alpha('#10b981', 0.12), color: '#10b981', fontSize: 10, height: 20, fontWeight: 600 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Button size="small" variant="outlined" onClick={onCancel} sx={{ fontSize: 11, textTransform: 'none', minWidth: 0, px: 1.5 }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={!hasChanges}
            onClick={handleSave}
            startIcon={<SaveIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              fontSize: 11,
              textTransform: 'none',
              minWidth: 0,
              px: 1.5,
              background: hasChanges ? accentGradient(theme) : undefined,
              ...(hasChanges && {
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(accent(theme), 0.4)}` },
                  '50%': { boxShadow: `0 0 0 6px ${alpha(accent(theme), 0)}` },
                },
              }),
            }}
          >
            {hasChanges ? 'Apply to JSON' : 'No Changes'}
          </Button>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Text area */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ fontSize: 10, color: 'text.disabled', letterSpacing: 1, mb: 1, display: 'block' }}>
            Edit Value
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={5}
            maxRows={12}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter text with placeholders like :::data.field"
            InputProps={{
              sx: {
                fontFamily: mono,
                fontSize: 13,
                lineHeight: 1.7,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
        </Box>

        {/* Hint when unsaved */}
        {hasChanges && (
          <Box
            sx={{
              bgcolor: alpha(accent(theme), 0.06),
              border: 1,
              borderColor: alpha(accent(theme), 0.18),
              borderRadius: 1.5,
              px: 1.5,
              py: 1,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: 12,
              color: 'text.secondary',
            }}
          >
            <LightbulbOutlinedIcon sx={{ fontSize: 16, color: accent(theme) }} />
            Click "Apply to JSON" to update the JSON editor
          </Box>
        )}

        {/* Quick insert */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>Quick Insert:</Typography>
          {quickPlaceholders.map((p) => (
            <Chip
              key={p}
              label={p}
              size="small"
              variant="outlined"
              icon={<Box component="span" sx={{ fontSize: '8px !important', color: 'primary.main', ml: '4px !important' }}>◆</Box>}
              onClick={() => insertPlaceholder(p)}
              sx={{
                fontFamily: mono,
                fontSize: 11,
                height: 24,
                cursor: 'pointer',
                '&:hover': { borderColor: accent(theme), color: accent(theme) },
              }}
            />
          ))}
        </Box>

        {/* Detected placeholders */}
        {placeholders.length > 0 && (
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 1, fontWeight: 500 }}>
              Detected Placeholders:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {placeholders.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  size="small"
                  sx={{
                    fontFamily: mono,
                    fontSize: 11,
                    height: 24,
                    bgcolor: alpha(accent(theme), 0.08),
                    color: theme.palette.mode === 'dark' ? '#a78bfa' : '#6d28d9',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Preview */}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
          <Box
            onClick={() => setShowPreview(!showPreview)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 1,
              cursor: 'pointer',
              borderBottom: showPreview ? 1 : 0,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {showPreview ? (
              <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            )}
            <Typography variant="overline" sx={{ fontSize: 10, color: 'text.disabled', letterSpacing: 1 }}>
              Preview
            </Typography>
          </Box>
          <Collapse in={showPreview}>
            <Box sx={{ p: 1.5, fontSize: 13, lineHeight: 1.8 }}>
              <PlaceholderHighlighter text={editValue} pattern={pattern} />
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Box>
  );
};

export default TextFieldEditor;

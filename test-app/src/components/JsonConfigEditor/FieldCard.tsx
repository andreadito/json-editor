import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { EditableField } from './types';
import { fieldCardSx, badgeSx, mono } from './theme';
import PlaceholderHighlighter from './PlaceholderHighlighter';

interface Props {
  field: EditableField;
  selected: boolean;
  pattern?: RegExp;
  onClick: () => void;
}

const PLACEHOLDER_REGEX = /:::([\w.]+)/g;

const FieldCard: React.FC<Props> = ({ field, selected, pattern = PLACEHOLDER_REGEX, onClick }) => {
  const truncated = field.value.length > 70 ? field.value.slice(0, 70) + '...' : field.value;
  const re = new RegExp(pattern.source, pattern.flags);
  const placeholderCount = (field.value.match(re) || []).length;

  return (
    <Box
      className="field-card"
      sx={[
        fieldCardSx(selected),
        { '&:hover .field-card-hint': { opacity: 1, color: 'primary.main' } },
      ]}
      onClick={onClick}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: 'primary.main', minWidth: 0, flex: 1 }}
        >
          {field.key}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
          {field.isLong && (
            <Box component="span" sx={badgeSx('long')}>
              long
            </Box>
          )}
          {placeholderCount > 0 && (
            <Box component="span" sx={badgeSx('vars')}>
              {placeholderCount} vars
            </Box>
          )}
        </Box>
      </Box>

      {/* Preview */}
      <Box
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          lineHeight: 1.5,
          maxHeight: 38,
          overflow: 'hidden',
          mb: 0.75,
          wordBreak: 'break-word',
        }}
      >
        {field.hasPlaceholders ? (
          <PlaceholderHighlighter text={truncated} pattern={pattern} />
        ) : (
          <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>
            {truncated}
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, gap: 1 }}>
        <Typography
          noWrap
          sx={{ fontFamily: mono, fontSize: 10, color: 'text.disabled', minWidth: 0, flex: 1 }}
        >
          {field.path}
        </Typography>
        <Typography
          className="field-card-hint"
          sx={{
            fontSize: 10,
            color: 'text.disabled',
            opacity: 0,
            transition: 'opacity 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Click to edit
        </Typography>
      </Box>
    </Box>
  );
};

export default React.memo(FieldCard);

import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import { placeholderChipSx, mono } from './theme';
import { resolveValue, formatResolved, parsePlaceholder } from './utils';
import type { ArrayFormat } from './types';

interface Props {
  text: string;
  pattern?: RegExp;
  /** When provided, placeholders are resolved and shown as their real values */
  context?: Record<string, unknown>;
  /** Fallback array format when no inline hint is present */
  arrayFormat?: ArrayFormat;
  customSeparator?: string;
  /** Data key for auto-drill resolution. Defaults to 'data'. */
  contextDataKey?: string | null;
}

const PlaceholderHighlighter: React.FC<Props> = ({
  text,
  pattern = /:::([\w.]+(?:\|(?:comma|newline|json|custom\([^)]*\)))?)/g,
  context,
  arrayFormat = 'comma',
  customSeparator = ' | ',
  contextDataKey = 'data',
}) => {
  const theme = useTheme();

  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    const re = new RegExp(pattern.source, pattern.flags);
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push(
          <Typography
            key={`t-${lastIndex}`}
            component="span"
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {text.slice(lastIndex, match.index)}
          </Typography>,
        );
      }

      const parsed = parsePlaceholder(match[1]);
      const fmt = parsed.format ?? arrayFormat;
      const sep = parsed.separator ?? customSeparator;

      if (context) {
        const resolved = resolveValue(context, parsed.name, contextDataKey);
        const isResolved = resolved !== undefined;
        const displayValue = isResolved
          ? formatResolved(resolved, fmt, sep)
          : parsed.name;

        const tooltipLabel = isResolved
          ? `:::${parsed.raw}` + (parsed.format ? '' : ` (${fmt})`)
          : 'Unresolved placeholder';

        result.push(
          <Tooltip
            key={`p-${match.index}`}
            title={tooltipLabel}
            arrow
            placement="top"
          >
            <Box
              component="span"
              sx={{
                display: 'inline',
                fontFamily: mono,
                fontSize: 12,
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                ...(isResolved
                  ? {
                      bgcolor: alpha('#10b981', 0.1),
                      color: '#10b981',
                      fontWeight: 600,
                    }
                  : {
                      bgcolor: alpha('#f59e0b', 0.1),
                      color: '#f59e0b',
                      textDecoration: 'underline dotted',
                    }),
              }}
            >
              {displayValue}
            </Box>
          </Tooltip>,
        );
      } else {
        result.push(
          <Box key={`p-${match.index}`} component="span" sx={placeholderChipSx}>
            <Box component="span" sx={{ fontSize: 8, color: 'primary.main' }}>
              ◆
            </Box>
            {parsed.name}
            {parsed.format && (
              <Box component="span" sx={{ fontSize: 9, color: 'text.disabled', ml: 0.5 }}>
                |{parsed.format === 'custom' ? `custom(${parsed.separator})` : parsed.format}
              </Box>
            )}
          </Box>,
        );
      }

      lastIndex = re.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push(
        <Typography
          key={`t-${lastIndex}`}
          component="span"
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          {text.slice(lastIndex)}
        </Typography>,
      );
    }

    return result;
  }, [text, pattern, context, arrayFormat, customSeparator, contextDataKey, theme]);

  return <>{parts}</>;
};

export default PlaceholderHighlighter;

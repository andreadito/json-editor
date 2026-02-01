import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { placeholderChipSx } from './theme';

interface Props {
  text: string;
  pattern?: RegExp;
}

const PlaceholderHighlighter: React.FC<Props> = ({
  text,
  pattern = /:::([\w.]+)/g,
}) => {
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
      result.push(
        <Box key={`p-${match.index}`} component="span" sx={placeholderChipSx}>
          <Box component="span" sx={{ fontSize: 8, color: 'primary.main' }}>
            ◆
          </Box>
          {match[1]}
        </Box>,
      );
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
  }, [text, pattern]);

  return <>{parts}</>;
};

export default PlaceholderHighlighter;

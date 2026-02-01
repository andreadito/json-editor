import React, { useCallback, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { mono } from './theme';

interface Props {
  open: boolean;
  config: Record<string, unknown>;
  onClose: () => void;
}

const OutputModal: React.FC<Props> = ({ open, config, onClose }) => {
  const output = useMemo(() => JSON.stringify(config), [config]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>Stringified Output</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          minRows={10}
          maxRows={18}
          value={output}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: mono, fontSize: 12, lineHeight: 1.6 },
          }}
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ textTransform: 'none' }}>
          Close
        </Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          size="small"
          startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          sx={{ textTransform: 'none' }}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OutputModal;

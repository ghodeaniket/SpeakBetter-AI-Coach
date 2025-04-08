import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface DebugLogProps {
  logs: string[];
  onClear?: () => void;
  title?: string;
  maxHeight?: number | string;
  downloadEnabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

const DebugLog: React.FC<DebugLogProps> = ({
  logs,
  onClear,
  title = 'Debug Logs',
  maxHeight = 300,
  downloadEnabled = true,
  backgroundColor = '#2b2b2b',
  textColor = '#f8f8f8'
}) => {
  // Download logs as a text file
  const handleDownload = () => {
    if (logs.length === 0) return;
    
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {downloadEnabled && (
            <Button
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              disabled={logs.length === 0}
            >
              Download
            </Button>
          )}
          
          {onClear && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClear}
              disabled={logs.length === 0}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>
      
      <Box 
        sx={{ 
          maxHeight, 
          overflowY: 'auto', 
          p: 2, 
          fontFamily: 'monospace', 
          fontSize: '0.875rem',
          bgcolor: backgroundColor,
          color: textColor,
          borderRadius: 1
        }}
      >
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>{log}</Box>
          ))
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#aaa' }}>
            No logs yet.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default DebugLog;

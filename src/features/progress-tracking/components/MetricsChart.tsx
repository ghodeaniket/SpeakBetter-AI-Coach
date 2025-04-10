import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
// Using a simplified chart representation since recharts is not installed

type MetricType = 'wordsPerMinute' | 'fillerWordPercentage' | 'clarityScore';

interface MetricsChartProps {
  data: {
    labels: string[];
    wordsPerMinute: number[];
    fillerWordPercentage: number[];
    clarityScore: number[];
  };
  title?: string;
  height?: number | string;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ 
  data, 
  title = 'Progress Over Time', 
  height = 300 
}) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<MetricType[]>(['wordsPerMinute', 'fillerWordPercentage', 'clarityScore']);

  const handleMetricsChange = (
    event: React.MouseEvent<HTMLElement>,
    newMetrics: MetricType[],
  ) => {
    if (newMetrics.length) {
      setMetrics(newMetrics);
    }
  };

  // Configure the colors and formats for each metric
  const metricConfig = {
    wordsPerMinute: {
      color: theme.palette.primary.main,
      name: 'Speaking Pace (WPM)',
    },
    fillerWordPercentage: {
      color: theme.palette.warning.main,
      name: 'Filler Words (%)',
    },
    clarityScore: {
      color: theme.palette.success.main,
      name: 'Clarity Score',
    },
  };

  return (
    <Card sx={{ boxShadow: 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={metrics}
            onChange={handleMetricsChange}
            aria-label="metrics to display"
            size="small"
          >
            <ToggleButton value="wordsPerMinute" aria-label="words per minute">
              <Typography 
                variant="caption" 
                sx={{ color: metricConfig.wordsPerMinute.color }}
              >
                Pace
              </Typography>
            </ToggleButton>
            <ToggleButton value="fillerWordPercentage" aria-label="filler word percentage">
              <Typography 
                variant="caption" 
                sx={{ color: metricConfig.fillerWordPercentage.color }}
              >
                Fillers
              </Typography>
            </ToggleButton>
            <ToggleButton value="clarityScore" aria-label="clarity score">
              <Typography 
                variant="caption" 
                sx={{ color: metricConfig.clarityScore.color }}
              >
                Clarity
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ width: '100%', height }}>
          {/* Simplified chart visualization - just displaying data in a table format */}
          <Paper variant="outlined" sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Chart visualization (simplified version)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Note: The chart visualization is simplified since the recharts library is not installed.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                Time Period
              </Typography>
              {metrics.includes('wordsPerMinute') && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ fontWeight: 'bold', color: metricConfig.wordsPerMinute.color }}
                >
                  Pace (WPM)
                </Typography>
              )}
              {metrics.includes('fillerWordPercentage') && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ fontWeight: 'bold', color: metricConfig.fillerWordPercentage.color }}
                >
                  Fillers (%)
                </Typography>
              )}
              {metrics.includes('clarityScore') && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ fontWeight: 'bold', color: metricConfig.clarityScore.color }}
                >
                  Clarity Score
                </Typography>
              )}
            </Box>
            
            {data.labels.map((label, index) => (
              <Box 
                key={label} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  p: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:nth-of-type(odd)': {
                    backgroundColor: alpha(theme.palette.background.default, 0.5)
                  }
                }}
              >
                <Typography variant="body2">{label}</Typography>
                {metrics.includes('wordsPerMinute') && (
                  <Typography variant="body2">{data.wordsPerMinute[index]}</Typography>
                )}
                {metrics.includes('fillerWordPercentage') && (
                  <Typography variant="body2">{data.fillerWordPercentage[index]}%</Typography>
                )}
                {metrics.includes('clarityScore') && (
                  <Typography variant="body2">{data.clarityScore[index]}/100</Typography>
                )}
              </Box>
            ))}
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricsChart;

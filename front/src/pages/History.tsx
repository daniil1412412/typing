import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

interface Result {
  id: number;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  test_type: string;
  created_at: string;
}

interface UserStats {
  best_wpm: number;
  avg_accuracy: number;
  total_tests: number;
  last_test_at: string;
}

const pixelFont = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '12px',
};

const testTypeLabels: Record<string, string> = {
  time: 'Таймер',
  words: 'На количество слов',
  adaptive: 'Адаптивный',
};

const History: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    fetchUserStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/results?per_page=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(response.data.data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

return (
  <Box
    sx={{
      backgroundColor: '#fff',
      color: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 1,
      ...pixelFont,
      boxSizing: 'border-box',
    }}
  >
    <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', mb: 4 }}>
      История тестов
    </Typography>
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        width: '100%',
        maxWidth: 1200,
        mb: 4,
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexShrink: 0,
      }}
    >
      {userStats?.top_results && userStats.top_results.length > 0 && (
        <Paper
          sx={{
            p: 2,
            flex: '1 1 50%',
            backgroundColor: '#f0f8ff',
            minHeight: 260,
            maxHeight: 280,
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1, color: '#0d47a1' }}>
            График результатов 
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userStats.top_results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="created_at"
                tick={{ fontSize: 10 }}
                tickFormatter={(str) => new Date(str).toLocaleDateString()}
              />
              <YAxis />
              <ChartTooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: '#fafafa',
          border: '2px dotted #1976d2',
          flex: '1 1 50%',
          maxHeight: 280,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#0d47a1', width: '25%' }}>Дата</TableCell>
              <Tooltip title="Words Per Minute – количество правильно напечатанных слов в минуту">
                <TableCell sx={{ color: '#0d47a1', width: '10%' }}>WPM</TableCell>
              </Tooltip>
              <TableCell sx={{ color: '#0d47a1', width: '15%' }}>Точность</TableCell>
              <TableCell sx={{ color: '#0d47a1', width: '10%' }}>Ошибки</TableCell>
              <TableCell sx={{ color: '#0d47a1', width: '20%' }}>Тип</TableCell>
              <TableCell sx={{ color: '#0d47a1', width: '10%' }}>⏱ Сек</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((res) => (
              <TableRow key={res.id}>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {new Date(res.created_at).toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{res.wpm}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{res.accuracy}%</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{res.errors}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {testTypeLabels[res.test_type] || res.test_type}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {res.test_type === 'timed' ? res.duration : '-'}
                </TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: '#f44336' }}>
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    {userStats && (
      <Paper
        sx={{
          backgroundColor: '#f9f9f9',
          border: '2px dashed #1976d2',
          padding: 2,
          marginTop: 'auto',
          width: '100%',
          maxWidth: 1200,
          boxSizing: 'border-box',
          ...pixelFont,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#0d47a1', mb: 1 }}>
          Общая статистика
        </Typography>
        <Divider sx={{ my: 1, borderColor: '#1976d2' }} />
        <Typography>
          Лучшая скорость: <b>{userStats.best_wpm}</b> WPM
        </Typography>
        <Typography>
          Средняя точность: <b>{userStats.avg_accuracy}%</b>
        </Typography>
        <Typography>
          Всего тестов: <b>{userStats.total_tests}</b>
        </Typography>
      </Paper>
    )}
  </Box>
);

};

export default History;

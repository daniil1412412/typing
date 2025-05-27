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
} from '@mui/material';
import axios from 'axios';

interface Result {
  id: number;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
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
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#fff',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
        ...pixelFont,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', mb: 4 }}>
        История тестов
      </Typography>

      {userStats && (
        <Paper
          sx={{
            backgroundColor: '#f9f9f9',
            border: '2px dashed #1976d2',
            padding: 2,
            marginBottom: 4,
            width: '100%',
            maxWidth: 800,
            ...pixelFont,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: '#0d47a1' }}> Общая статистика</Typography>
          <Divider sx={{ my: 1, borderColor: '#1976d2' }} />
          <Typography> Лучшая скорость: <b>{userStats.best_wpm}</b> WPM</Typography>
          <Typography> Средняя точность: <b>{userStats.avg_accuracy}%</b></Typography>
          <Typography> Всего тестов: <b>{userStats.total_tests}</b></Typography>
        </Paper>
      )}

      {loading ? (
        <CircularProgress sx={{ color: '#1976d2' }} />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: '#fafafa',
            border: '2px dotted #1976d2',
            width: '100%',
            maxWidth: 800,
            ...pixelFont,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#0d47a1' }}>Дата</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>WPM</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>Точность</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>Ошибки</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>⏱ Сек</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>{new Date(res.created_at).toLocaleString()}</TableCell>
                  <TableCell>{res.wpm}</TableCell>
                  <TableCell>{res.accuracy}%</TableCell>
                  <TableCell>{res.errors}</TableCell>
                  <TableCell>{res.duration}</TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: '#f44336' }}>
                    Нет данных для отображения
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default History;

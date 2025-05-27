import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

interface LeaderboardEntry {
  user_id: number;
  max_wpm: number;
  user: {
    id: number;
    name: string;
  };
}

const pixelFont = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '12px',
};

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/leaderboard');
      if (Array.isArray(response.data)) {
        setLeaders(response.data);
      } else {
        console.error('Ошибка в данных ответа');
      }
    } catch (error) {
      console.error('Ошибка при получении рейтинга:', error);
    } finally {
      setLoading(false);
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
        Рейтинг пользователей
      </Typography>

      {loading ? (
        <CircularProgress sx={{ color: '#1976d2' }} />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: '#fafafa',
            border: '2px solid #1976d2',
            width: '100%',
            maxWidth: 800,
            ...pixelFont,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#0d47a1' }}>Место</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>Пользователь</TableCell>
                <TableCell sx={{ color: '#0d47a1' }}>WPM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaders.length > 0 ? (
                leaders.map((entry, index) => (
                  <TableRow key={entry.user_id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.user.name}</TableCell>
                    <TableCell>{entry.max_wpm}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: '#f44336' }}>
                    Пока нет данных
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

export default Leaderboard;

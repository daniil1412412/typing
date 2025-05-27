import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const pixelFont = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '12px',
};

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Ошибка при парсинге user из localStorage:', error);
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #1976d2',
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...pixelFont,
        color: '#000',
      }}
    >
      <Typography sx={{ ...pixelFont, color: '#1976d2' }}>
        TypingApp
      </Typography>

      <Box display="flex" gap={2}>
        <Button component={Link} to="/" sx={navButtonStyle}>
          Тест
        </Button>
        <Button component={Link} to="/history" sx={navButtonStyle}>
          История
        </Button>
        <Button component={Link} to="/leaderboard" sx={navButtonStyle}>
          Рейтинг
        </Button>

        {token ? (
          <>
            <Typography sx={{ alignSelf: 'center', color: '#444' }}>
              {user?.name}
            </Typography>
            <Button onClick={handleLogout} sx={navButtonStyle}>
              Выйти
            </Button>
          </>
        ) : (
          <>
            <Button component={Link} to="/login" sx={navButtonStyle}>
              Войти
            </Button>
            <Button component={Link} to="/register" sx={navButtonStyle}>
              Регистрация
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

const navButtonStyle = {
  color: '#1976d2',
  border: '1px solid #1976d2',
  backgroundColor: 'transparent',
  ...pixelFont,
  '&:hover': {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    borderColor: '#0d47a1',
  },
};

export default Navbar;

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const pixelFont = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '12px',
};

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/register', {
        name,
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err: any) {
      setError('Ошибка при регистрации. Проверьте данные или попробуйте позже.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#fff',
        color: '#00FF00',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...pixelFont,
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, backgroundColor: '#fff', border: '2px dashed #FFD700', width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#FFD700', mb: 4 }}>
          Регистрация
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, color: '#FF0000' }}>{error}</Alert>}

        <form onSubmit={handleRegister}>
          {['Имя', 'Email', 'Пароль'].map((label, i) => (
            <TextField
              key={label}
              label={label}
              type={label === 'Пароль' ? 'password' : 'text'}
              value={label === 'Имя' ? name : label === 'Email' ? email : password}
              fullWidth
              required
              margin="normal"
              onChange={(e) =>
                label === 'Имя' ? setName(e.target.value) :
                label === 'Email' ? setEmail(e.target.value) :
                setPassword(e.target.value)
              }
              sx={{
                input: { color: '#00FF00' },
                '& .MuiInputLabel-root': { color: '#00FF00' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#00FF00' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                },
              }}
            />
          ))}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: '#FFD700',
              color: '#000',
              '&:hover': { backgroundColor: '#FFA500' },
            }}
          >
            Зарегистрироваться
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;

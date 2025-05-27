import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
];

const TypingTest = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(60);
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [errors, setErrors] = useState(0);
  const [chartData, setChartData] = useState<{ time: number, errors: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [errorLog, setErrorLog] = useState<{ char_index: number, expected: string, actual: string }[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const pixelFont = {
    fontFamily: '"Press Start 2P", monospace',
  };

  // Загрузка текста по языку
  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/text?lang=${language}`);
        const data = await res.json();
        if (typeof data.text === 'string') {
          setText(data.text);
          resetTest();
        } else {
          console.error('Неверный формат текста');
        }
      } catch (err) {
        console.error('Ошибка при загрузке текста:', err);
      }
    };
    fetchText();
  }, [language]);

  // Таймер и обновление данных для графика
  useEffect(() => {
    if (startTime && timeLeft > 0 && !finished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            setFinished(true);
          }
          return next;
        });
        setChartData(prev => [...prev, { time: duration - timeLeft + 1, errors }]);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [startTime, timeLeft, finished, errors, duration]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (finished) return;

    const key = e.key;
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (key === 'Backspace') {
      if (currentIndex > 0) {
        setUserInput(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
      }
    } else if (key.length === 1) {
      setUserInput(prev => prev + key);
      if (key !== text[currentIndex]) {
        setErrors(prev => prev + 1);
        setErrorLog(prev => [...prev, {
          char_index: currentIndex,
          expected: text[currentIndex] ?? '',
          actual: key,
        }]);
      }
      setCurrentIndex(prev => prev + 1);
    }

    if (currentIndex + 1 >= text.length || timeLeft <= 0) {
      setFinished(true);
      clearInterval(intervalRef.current!);
    }
  };

  const resetTest = () => {
    setUserInput('');
    setCurrentIndex(0);
    setStartTime(null);
    setTimeLeft(duration);
    setErrors(0);
    setChartData([]);
    setFinished(false);
    setErrorLog([]);
    setApiError(null);
  };

  const getWPM = () => {
    const minutes = duration / 60;
    return Math.round((userInput.length / 5) / minutes);
  };

  const getAccuracy = () => {
    return Math.max(0, Math.round(((userInput.length - errors) / userInput.length) * 100));
  };

  const prepareErrorLog = (errorLog: { char_index: number, expected: string, actual: string }[]) => {
    return errorLog.map((error) => {
      if (!error.expected) error.expected = text[error.char_index] || '';
      if (!error.actual) error.actual = '';
      if (error.expected === '' && error.actual === '') return null;
      return error;
    }).filter(Boolean);
  };

  useEffect(() => {
    const saveResult = async () => {
      if (!finished || userInput.length === 0) return;

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Пользователь не авторизован. Результаты не будут сохранены.');
        return;
      }

      try {
        setIsLoading(true);
        const preparedErrorLog = prepareErrorLog(errorLog);

        const response = await api.post('/save-result', {
          wpm: getWPM(),
          accuracy: getAccuracy(),
          errors,
          duration,
          raw_text: text,
          input_text: userInput,
          error_log: preparedErrorLog,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Результаты сохранены:', response.data);
      } catch (err) {
        let errorMessage = 'Ошибка при сохранении результатов';
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setApiError(errorMessage);
        console.error('Ошибка сохранения:', err);
      } finally {
        setIsLoading(false);
      }
    };

    saveResult();
  }, [finished, userInput, errors, duration, text, errorLog]);

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        color: '#000',
        px: 2,
        ...pixelFont,
      }}
    >
      {/* Выбор языка сверху */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {LANGUAGES.map(({ code, label }) => (
          <Button
            key={code}
            variant={language === code ? 'contained' : 'outlined'}
            onClick={() => setLanguage(code)}
            sx={{
              backgroundColor: language === code ? '#e3f2fd' : 'transparent',
              color: '#1976d2',
              border: '2px solid #1976d2',
              ...pixelFont,
              '&:hover': {
                backgroundColor: '#bbdefb',
                color: '#0d47a1',
                borderColor: '#0d47a1',
              },
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {/* Время */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {[30, 60, 120].map((value) => (
          <Button
            key={value}
            variant={duration === value ? 'contained' : 'outlined'}
            onClick={() => {
              setDuration(value);
              resetTest();
            }}
            sx={{
              backgroundColor: duration === value ? '#e3f2fd' : 'transparent',
              color: '#1976d2',
              border: '2px solid #1976d2',
              ...pixelFont,
              '&:hover': {
                backgroundColor: '#bbdefb',
                color: '#0d47a1',
                borderColor: '#0d47a1',
              },
            }}
          >
            {value} сек
          </Button>
        ))}
      </Box>

      <Typography
        textAlign="center"
        sx={{ mb: 2, fontSize: '14px', color: '#f44336', ...pixelFont }}
      >
        Осталось времени: {timeLeft} сек
      </Typography>

      {!finished && (
        <Paper
          elevation={1}
          tabIndex={0}
          ref={inputRef}
          onKeyDown={handleKeyDown}
          sx={{
            px: 3,
            py: 2,
            minHeight: 150,
            backgroundColor: '#f9f9f9',
            color: '#000',
            fontSize: '16px',
            outline: 'none',
            whiteSpace: 'pre-wrap',
            border: '2px dashed #1976d2',
            mx: 2,
            ...pixelFont,
          }}
        >
          {text.split('').map((char, idx) => {
            let color = 'gray';
            if (idx < currentIndex) {
              color = userInput[idx] === char ? '#1976d2' : '#f44336';
            } else if (idx === currentIndex) {
              color = '#ff9800';
            }
            return (
              <span key={idx} style={{ color }}>
                {char}
              </span>
            );
          })}
        </Paper>
      )}

      {finished && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography sx={pixelFont}>WPM: {getWPM()}</Typography>
          <Typography sx={pixelFont}>Точность: {getAccuracy()}%</Typography>
          <Typography sx={pixelFont}>Ошибки: {errors}</Typography>

          <Box sx={{ width: '100%', height: 200, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#000', ...pixelFont }} />
                <YAxis tick={{ fontSize: 10, fill: '#000', ...pixelFont }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#222', borderColor: '#00FF00' }}
                  labelStyle={{ color: '#FFD700', ...pixelFont }}
                  itemStyle={{ color: '#FF4D4D', ...pixelFont }}
                />
                <Line type="monotone" dataKey="errors" stroke="#FF4D4D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Button
            variant="contained"
            onClick={resetTest}
            sx={{
              mt: 3,
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              border: '2px solid #1976d2',
              boxShadow: 'none',
              ...pixelFont,
              '&:hover': {
                backgroundColor: '#bbdefb',
                borderColor: '#0d47a1',
                color: '#0d47a1',
              },
            }}
          >
            🔁 Пройти заново
          </Button>
        </Box>
      )}

      {apiError && (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            backgroundColor: '#ffebee',
            color: '#c62828',
            ...pixelFont,
          }}
        >
          {apiError}
        </Alert>
      )}
    </Box>
  );
};

export default TypingTest;


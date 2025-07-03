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
import '../assets/Tooltip.css';


const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];
type ModeType = 'timed' | 'word' | 'adaptive' | 'numbers';
const TypingTest = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(60);
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [errors, setErrors] = useState(0);
  const [chartData, setChartData] = useState<{ time: number; errors: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [errorLog, setErrorLog] = useState<{ char_index: number; expected: string; actual: string }[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [mode, setMode] = useState<ModeType>('timed');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const pixelFont = {
    fontFamily: '"Press Start 2P", monospace',
  };
  const fetchNormalText = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/text?lang=${language}`);
      const data = await res.json();
      if (typeof data.text === 'string') {
        if (mode === 'word') {
          setText(data.text.split(' ').slice(0, 50).join(' '));
        } else {
          setText(data.text);
        }
        resetTest();
      } else {
        console.error('Неверный формат текста');
      }
    } catch (err) {
      console.error('Ошибка при загрузке текста:', err);
    }
  };
  const fetchAdaptiveText = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/text?lang=${language}`);
      const data = await res.json();
      if (typeof data.text !== 'string') throw new Error('Неверный формат текста');

      const words = data.text.split(/\s+/);
      if (errorLog.length === 0) {
        setText(words.slice(0, 50).join(' '));
        resetTest();
        return;
      }
      const freqMap: Record<string, number> = {};
      errorLog.forEach((e) => {
        if (e.expected) freqMap[e.expected] = (freqMap[e.expected] || 0) + 1;
      });
      const commonErrors = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);
      const filteredWords = words.filter((w) =>
        commonErrors.some((ch) => w.includes(ch))
      );
      let adaptiveWords = filteredWords.slice(0, 50);
      if (adaptiveWords.length < 50) {
        const needed = 50 - adaptiveWords.length;
        const extraWords = words.filter((w) => !adaptiveWords.includes(w)).slice(0, needed);
        adaptiveWords = adaptiveWords.concat(extraWords);
      }
      setText(adaptiveWords.join(' '));
      resetTest();
    } catch (err) {
      console.error('Ошибка при загрузке адаптивного текста:', err);
      await fetchNormalText();
    }
  };
  useEffect(() => {
    if (mode === 'adaptive') {
      fetchAdaptiveText();
    } else if (mode === 'numbers') {
      generateNumberText();
    } else {
      fetchNormalText();
    }
  }, [language, mode]);
const generateNumberText = async () => {
  try {
    const res = await fetch(`http://localhost:8000/api/text?lang=${language}`);
    const data = await res.json();
    if (typeof data.text !== 'string') throw new Error('Неверный формат текста');

    const allWords = data.text.split(/\s+/).filter(Boolean);
    const numberCount = 25;
    const digits = '0123456789';
    const numberWords: string[] = [];
    while (numberWords.length < numberCount) {
      const length = Math.floor(Math.random() * 5) + 1; 
      let word = '';
      for (let i = 0; i < length; i++) {
        word += digits[Math.floor(Math.random() * digits.length)];
      }
      numberWords.push(word);
    }
    const wordCount = 50 - numberCount;
    const textWords = allWords.slice(0, wordCount);
    const combined = [...textWords, ...numberWords];

    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    setText(combined.join(' '));
    resetTest();
  } catch (err) {
    console.error('Ошибка при загрузке текста для режима цифр:', err);
    await fetchNormalText();
  }
};


  useEffect(() => {
    if (mode === 'timed' && startTime && timeLeft > 0 && !finished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            setFinished(true);
          }
          return next;
        });
        setChartData((prev) => [...prev, { time: duration - timeLeft + 1, errors }]);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [startTime, timeLeft, finished, errors, duration, mode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (finished) return;

    const key = e.key;
    if (!startTime) setStartTime(Date.now());

    if (key === 'Backspace') {
      if (currentIndex > 0) {
        setUserInput((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
      }
    } else if (key.length === 1) {
      setUserInput((prev) => prev + key);
      if (key !== text[currentIndex]) {
        setErrors((prev) => prev + 1);
        setErrorLog((prev) => [
          ...prev,
          {
            char_index: currentIndex,
            expected: text[currentIndex] ?? '',
            actual: key,
          },
        ]);
      }
      setCurrentIndex((prev) => prev + 1);
    }
    const isTestOver =
      mode === 'timed'
        ? currentIndex + 1 >= text.length || timeLeft <= 0
        : mode === 'word'
        ? userInput.trim().split(/\s+/).length >= 50
        : false; 
    if (isTestOver) {
      setFinished(true);
      clearInterval(intervalRef.current!);
    }
  };

  const resetTest = () => {
    clearInterval(intervalRef.current!);
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
    const elapsedMinutes = startTime
      ? (Math.max(Date.now() - startTime, 1000) / 1000) / 60
      : duration / 60;
    return Math.round(
      (userInput.trim().split(/\s+/).filter(Boolean).length || 1) / elapsedMinutes
    );
  };

  const getAccuracy = () => {
    if (userInput.length === 0) return 100;
    return Math.max(
      0,
      Math.round(((userInput.length - errors) / userInput.length) * 100)
    );
  };

  const prepareErrorLog = (
    errorLog: { char_index: number; expected: string; actual: string }[]
  ) => {
    return errorLog
      .map((error) => {
        if (!error.expected) error.expected = text[error.char_index] || '';
        if (!error.actual) error.actual = '';
        if (error.expected === '' && error.actual === '') return null;
        return error;
      })
      .filter(Boolean);
  };

  useEffect(() => {
    const saveResult = async () => {
  if (!finished || userInput.length === 0) return;

  const token = localStorage.getItem('token');
  console.log('Токен для отладки:', token);
  
  if (!token) {
    console.log('Пользователь не авторизован. Результаты не будут сохранены.');
    return;
  }

  try {
    setIsLoading(true);
    const preparedErrorLog = prepareErrorLog(errorLog);
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Токен просрочен');
      }
    }

    const response = await api.post(
      '/save-result',
      {
        wpm: getWPM(),
        accuracy: getAccuracy(),
        errors,
        duration,
        raw_text: text,
        input_text: userInput,
        test_type: mode,
        error_log: preparedErrorLog,
      },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );
    
    console.log('Результаты сохранены:', response.data);
  } catch (err) {
    let errorMessage = 'Ошибка при сохранении результатов';
    if (axios.isAxiosError(err)) {
      errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        errorMessage = 'Сессия истекла. Пожалуйста, войдите снова.';
        localStorage.removeItem('token');
        // Перенаправление на страницу входа
        window.location.href = '/login';
      }
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
  }, [finished]);
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        ...pixelFont,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant={mode === 'timed' ? 'contained' : 'outlined'}
          onClick={() => setMode('timed')}
          sx={pixelFont}
        >
          Таймер
        </Button>
        <Button
          variant={mode === 'word' ? 'contained' : 'outlined'}
          onClick={() => setMode('word')}
          sx={pixelFont}
        >
          50 слов
        </Button>
        <Button
          variant={mode === 'adaptive' ? 'contained' : 'outlined'}
          onClick={() => setMode('adaptive')}
          sx={pixelFont}
        >
          Адаптивный
        </Button>
        <Button
        variant={mode === 'numbers' ? 'contained' : 'outlined'}
        onClick={() => setMode('numbers')}
        sx={pixelFont}
        >
        Цифры
      </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {LANGUAGES.map(({ code, label }) => (
          <Button
            key={code}
            variant={language === code ? 'contained' : 'outlined'}
            onClick={() => setLanguage(code)}
            sx={pixelFont}
          >
            {label}
          </Button>
        ))}
      </Box>
      {mode === 'timed' && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {[30, 60, 120].map((val) => (
            <Button
              key={val}
              variant={duration === val ? 'contained' : 'outlined'}
              onClick={() => {
                setDuration(val);
                resetTest();
              }}
              sx={pixelFont}
            >
              {val} сек
            </Button>
          ))}
        </Box>
      )}
        <Typography sx={{ mb: 2, fontSize: '14px', color: '#f44336', ...pixelFont }}>
          {mode === 'timed'
            ? `Осталось времени: ${timeLeft} сек`
            : mode === 'word' || mode === 'numbers'
            ? `Введено слов: ${userInput.trim().split(/\s+/).filter(Boolean).length}/50`
            : 'Адаптивный режим: набирайте текст и нажмите кнопку завершения теста'}
        </Typography>

      {!finished && (
        <>
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
              fontSize: '16px',
              outline: 'none',
              whiteSpace: 'pre-wrap',
              border: '2px dashed #1976d2',
              mx: 2,
              ...pixelFont,
              userSelect: 'none',
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
          <Button
            variant="outlined"
            onClick={() => {
              clearInterval(intervalRef.current!);
              setFinished(true);
            }}
            sx={{ mt: 2, ...pixelFont }}
          >
            Завершить тест
          </Button>
        </>
      )}
      {finished && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
            <div className="wpm-tooltip" style={{ display: 'inline-block' }}>
              <Typography sx={pixelFont}>WPM: {getWPM()}</Typography>
                  <span className="tooltip-text" style={pixelFont}>
                    WPM = Words Per Minute (Слов в минуту)<br />
                    Расчет: (Слова / Время) * 60<br />
                    Слово = 5 символов
                  </span>
            </div>
            
          <Typography sx={pixelFont}>Точность: {getAccuracy()}%</Typography>
          <Typography sx={pixelFont}>Ошибки: {errors}</Typography>
          {mode === 'timed' && (
            <Box sx={{ width: '100%', height: 200, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#000', ...pixelFont }} />
                  <YAxis tick={{ fontSize: 10, fill: '#000', ...pixelFont }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="errors"
                    stroke="#f44336"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          <Button
            variant="contained"
            onClick={() => {
              resetTest();
              if (mode === 'adaptive') fetchAdaptiveText();
              else fetchNormalText();
            }}
            sx={{ mt: 3, ...pixelFont }}
          >
            Начать заново
          </Button>
        </Box>
      )}
      {apiError && (
        <Alert severity="error" sx={{ mt: 2, ...pixelFont }}>
          {apiError}
        </Alert>
      )}
      {isLoading && (
        <Typography sx={{ mt: 1, fontSize: '12px', ...pixelFont }}>
          Сохранение результатов...
        </Typography>
      )}
    </Box>
  );
};

export default TypingTest;

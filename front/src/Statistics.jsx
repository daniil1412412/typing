import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';

export default function Statistics() {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchResults = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/results?page=${pageNum}&per_page=5`);
      setResults(response.data.data);
      setPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch (error) {
      console.error('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-12 font-mono text-gray-800">
      <h2 className="text-center text-2xl mb-6">📊 Статистика</h2>

      {loading ? (
        <p className="text-center text-gray-500">Загрузка...</p>
      ) : (
        <TableContainer component={Paper} className="bg-white shadow-md">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-100">
                <TableCell className="!text-gray-800 font-semibold">Дата</TableCell>
                <TableCell className="!text-gray-800 font-semibold">WPM</TableCell>
                <TableCell className="!text-gray-800 font-semibold">Точность</TableCell>
                <TableCell className="!text-gray-800 font-semibold">Ошибки</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50">
                  <TableCell className="!text-gray-800">
                    {new Date(r.created_at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="!text-gray-800">{r.wpm}</TableCell>
                  <TableCell className="!text-gray-800">{r.accuracy}%</TableCell>
                  <TableCell className="!text-gray-800">{r.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outlined"
          disabled={page === 1}
          onClick={() => fetchResults(page - 1)}
          sx={{ color: 'black', borderColor: 'gray' }}
        >
          Назад
        </Button>
        <span className="self-center text-sm text-gray-600 font-semibold">
          стр. {page} / {lastPage}
        </span>
        <Button
          variant="outlined"
          disabled={page === lastPage}
          onClick={() => fetchResults(page + 1)}
          sx={{ color: 'black', borderColor: 'gray' }}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import './BarcodeHistory.css';

const BarcodeHistory = () => {
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // По умолчанию убывание по дате
  const [totalPages, setTotalPages] = useState(1);

  const handleSearch = async () => {
    try {
      const data = await productService.getProductHistoryByBarcode(barcode, page, sortField, sortOrder);
      if (data.results.length === 0) {
        setErrorMessage('нет истории этого шк на фс');
        setHistory([]);
      } else {
        setHistory(data.results);
        setTotalPages(data.total_pages);
        setErrorMessage('');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Ошибка при получении истории');
    }
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    setPage(1); // Сбрасываем на первую страницу при сортировке
  };

  useEffect(() => {
    if (barcode) handleSearch();
  }, [page, sortField, sortOrder]);

  return (
    <div className="barcode-history-container">
      <h1>История по штрихкоду</h1>
      <div className="search-bar">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Введите штрихкод"
        />
        <button onClick={handleSearch}>Поиск</button>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {history.length > 0 ? (
        <table className="history-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('operation_type_name')}>Тип операции</th>
              <th onClick={() => handleSort('user_full_name')}>Пользователь</th>
              <th onClick={() => handleSort('date')}>Дата {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, index) => (
              <tr key={index}>
                <td>{entry.operation_type_name || 'N/A'}</td>
                <td>{entry.user_full_name || 'N/A'}</td>
                <td>{new Date(entry.date).toLocaleString()}</td>
                <td>{entry.comment || 'Нет комментария'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !errorMessage && <p>Нет данных по истории для данного штрихкода.</p>
      )}

      {/* Пагинация */}
      <div className="pagination">
        <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
          Назад
        </button>
        <span>Страница {page} из {totalPages}</span>
        <button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>
          Вперед
        </button>
      </div>
    </div>
  );
};

export default BarcodeHistory;

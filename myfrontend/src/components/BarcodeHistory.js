import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import './BarcodeHistory.css';

const BarcodeHistory = () => {
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // Default sorting by descending date
  const [totalPages, setTotalPages] = useState(1);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);

  const handleSearch = async () => {
    try {
      const data = await productService.getProductHistoryByBarcode(barcode, page, sortField, sortOrder);
  
      if (data && data.results && data.results.history && data.results.history.length > 0) {
        setHistory(data.results.history); // Устанавливаем историю операций
        setTotalPages(data.total_pages || 1);
        setErrorMessage('');
  
        // Получаем последнюю заявку и накладную, если они есть
        setLastRequest(data.results.last_request || null);
        setLastInvoice(data.results.last_invoice || null);
      } else {
        setErrorMessage('нет истории этого шк на фс');
        setHistory([]);
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
    setPage(1); // Reset to the first page when sorting
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
        <button className="search-button" onClick={handleSearch}>Поиск</button>
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
              <th>№ документа</th>
              <th>Дата документа</th>
            </tr>
          </thead>
          <tbody>
              {history.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.operation_type_name || 'N/A'}</td>
                  <td>{entry.user_full_name || 'N/A'}</td>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  <td>{entry.comment || 'Нет комментария'}</td>
                  <td>
                    {entry.operation_type_name === 'Принят' || entry.operation_type_name === 'Фото'
                      ? lastRequest?.RequestNumber || 'N/A'
                      : lastInvoice?.InvoiceNumber || 'N/A'}
                  </td>
                  <td>
                    {entry.operation_type_name === 'Принят' || entry.operation_type_name === 'Фото'
                      ? lastRequest?.creation_date
                        ? new Date(lastRequest.creation_date).toLocaleString()
                        : 'N/A'
                      : lastInvoice?.date
                      ? new Date(lastInvoice.date).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      ) : (
        !errorMessage && <p>Нет данных по истории для данного штрихкода.</p>
      )}

      {/* Pagination */}
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

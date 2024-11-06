import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DefectOperations.css';

const API_URL = 'http://192.168.6.251:8000/public/defect-operations/';

const DefectOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortColumn, setSortColumn] = useState(''); // Display name of the column
  const [sortField, setSortField] = useState(''); // Field name for the backend
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchOperations();
  }, [page, searchBarcode, searchName, sortField, sortOrder]);

  const fetchOperations = async () => {
    setLoading(true);
    setError('');

    const params = {
      page: page > 0 ? page : 1, // Проверка на положительный номер страницы
      barcode: searchBarcode,
      name: searchName,
      sort_order: sortOrder,
    };

    if (sortField) {
      params.sort_field = sortField;
    }

    try {
      const response = await axios.get(API_URL, { params });
      const data = response.data;

      // Обновляем данные операций и общее количество страниц
      setOperations(data.results || []);
      const calculatedTotalPages = Math.ceil(data.count / 100); // Здесь используем 100 для page_size
      setTotalPages(calculatedTotalPages);

      // Если номер страницы превышает totalPages, сбрасываем на первую страницу
      if (page > calculatedTotalPages) {
        console.log(`Page ${page} is invalid, resetting to page 1.`);
        setPage(1);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Ошибка 404: Неверный номер страницы');
      } else {
        setError('Ошибка при загрузке операций');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleSort = (column) => {
    const sortFields = {
      barcode: 'product__barcode',
      product_name: 'product__name',
      user_full_name: 'user_full_name', // if you have this field for user
      date: 'date',
    };

    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortField(sortFields[column] || column); // Set the correct backend field name
      setSortOrder('asc');
    }
  };

  return (
    <div className="defect-operations">
      <h1>История операций - Брак</h1>

      {/* Search fields */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по наименованию"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('barcode')}>Штрихкод {sortColumn === 'barcode' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('product_name')}>Наименование {sortColumn === 'product_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('user_full_name')}>Товаровед {sortColumn === 'user_full_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('date')}>Дата {sortColumn === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {operations.length > 0 ? (
                operations.map((operation, index) => (
                  <tr key={index}>
                    <td>{operation.barcode}</td>
                    <td>{operation.product_name}</td>
                    <td>{operation.user_full_name}</td>
                    <td>{new Date(operation.date).toLocaleDateString()}</td>
                    <td>{operation.comment}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Нет данных для отображения</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(1)} disabled={page === 1}>Первая</button>
        <button onClick={handlePreviousPage} disabled={page === 1}>Предыдущая</button>
        <span>Страница {page} из {totalPages}</span>
        <button onClick={handleNextPage} disabled={page === totalPages}>Следующая</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>Последняя</button>
      </div>
    </div>
  );
};

export default DefectOperations;

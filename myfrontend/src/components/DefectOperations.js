import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DefectOperations.css';

const API_URL = 'http://192.168.6.17:8000/public/defect-operations/';

const DefectOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortColumn, setSortColumn] = useState('date'); // Display name of the default column
  const [sortField, setSortField] = useState('date'); // Field name for the backend (default to 'date')
  const [sortOrder, setSortOrder] = useState('desc'); // Default order to 'desc'

  useEffect(() => {
    fetchOperations();
  }, [page, searchBarcode, searchName, sortField, sortOrder]);

  const fetchOperations = async () => {
    setLoading(true);
    setError('');

    const params = {
      page: page > 0 ? page : 1,
      barcode: searchBarcode,
      name: searchName,
      sort_field: sortField,
      sort_order: sortOrder,
    };

    try {
      const response = await axios.get(API_URL, { params });
      const data = response.data;

      setOperations(data.results || []);
      const calculatedTotalPages = Math.ceil(data.count / 100);
      setTotalPages(calculatedTotalPages);

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
      user_full_name: 'user_full_name',
      date: 'date',
    };

    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortField(sortFields[column] || column);
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DefectOperations.css';

const API_URL = 'http://192.168.1.174:8000/public/defect-operations/';

const DefectOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortColumn, setSortColumn] = useState(''); // Отображаемое имя столбца
  const [sortField, setSortField] = useState(''); // Полное имя столбца для сервера
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchOperations(page);
  }, [page, searchBarcode, searchName, sortField, sortOrder]);

  const fetchOperations = async (page) => {
    setLoading(true);
    setError('');
    
    const params = {
      page,
      barcode: searchBarcode,
      name: searchName,
    };
  
    if (sortField) {
      params.sort_field = sortField;
      params.sort_order = sortOrder;
    }
  
    try {
      const response = await axios.get(API_URL, { params });
      const data = response.data;
      setOperations(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err) {
      setError('Ошибка при загрузке операций');
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
      user_full_name: 'user_full_name', // если у вас есть поле user
      date: 'date',
    };

    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortField(sortFields[column] || column); // Устанавливаем корректное серверное поле
      setSortOrder('asc');
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="defect-operations">
      <h1>История операций - Брак</h1>

      {/* Поисковые поля */}
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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('barcode')}>
                Штрихкод {sortColumn === 'barcode' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('product_name')}>
                Наименование {sortColumn === 'product_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('user_full_name')}>
                Товаровед {sortColumn === 'user_full_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('date')}>
                Дата {sortColumn === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
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

      {/* Пагинация */}
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

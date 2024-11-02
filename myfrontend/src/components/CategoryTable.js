import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './CategoryTable.css';

const API_URL = 'http://192.168.6.44:8000/';

const CategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, [searchId, searchName, currentPage]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}api/categories/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          id: searchId || undefined,
          name: searchName || undefined,
          page: currentPage,
        },
      });

      if (response.data && response.data.results) {
        setCategories(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10));
        setFetchError('');
      } else {
        setCategories([]);
        setFetchError('Получены неверные данные');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setFetchError('Не удалось загрузить категории. Проверьте авторизацию и подключение.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadMessage('Выберите файл для загрузки');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const categories = jsonData.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        reference_link: row[2],
      }));

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}api/upload-categories/`, { categories }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setUploadMessage(response.data.message || 'Файл загружен успешно');
      } catch (error) {
        console.error('Failed to upload file:', error);
        setUploadMessage('Ошибка при загрузке файла');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="main-content">
      <h1>Категории</h1>
      <div className="upload-container">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Добавить категории</button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>
      {fetchError && <div className="error-message">{fetchError}</div>}

      {/* Search Fields */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по ID категории"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по имени категории"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="category-table">
          <thead>
            <tr>
              <th>ID категории</th>
              <th>Имя</th>
              <th>Ссылка на референс</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>
                  {category.reference_link ? (
                    <a href={category.reference_link} target="_blank" rel="noopener noreferrer" className="reference-button">
                      Ссылка
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
          Первая
        </button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Предыдущая
        </button>
        <span>
          Страница {currentPage} из {totalPages}
        </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Следующая
        </button>
        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
          Последняя
        </button>
      </div>
    </div>
  );
};

export default CategoryTable;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './AdminProducts.css';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Получаем токен из локального хранилища
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);  // Initialize products as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Default current page
  const [totalPages, setTotalPages] = useState(1); // Total pages
  const [showModal, setShowModal] = useState(false); // For managing the modal window
  const [fileData, setFileData] = useState(null); // Data from Excel file

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://192.168.6.229:8000/api/products/?page=${page}`, {
        headers: getAuthHeaders(), // Добавляем заголовки аутентификации
      });
      console.log('Response Data:', response.data);
  
      if (response.data && response.data.results) {
        setProducts(response.data.results); // Проверяем, что 'results' существует
        setTotalPages(Math.ceil(response.data.count / 100)); // Предполагаем, что 100 элементов на странице
      } else {
        setProducts([]); // Если 'results' не определен, возвращаем пустой массив
      }
  
      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить продукты');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage); // Fetch products on page change
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Отладка данных после извлечения
        console.log("Сырые данные из Excel:", jsonData);

        // Преобразуем строки в объекты
        const formattedData = jsonData.slice(1).map((row, index) => ({
            barcode: row[0] ? String(row[0]).trim() : null,
            name: row[1] ? String(row[1]).trim() : null,
            category_id: row[2] ? Number(row[2]) : null,
            seller: row[3] ? Number(row[3]) : null,
            in_stock_sum: row[4] ? Number(row[4]) : 0,
            cell: row[5] ? String(row[5]).trim() : null
        }));

        console.log("Форматированные данные для отправки:", formattedData);

        setFileData(formattedData);
    };

    reader.readAsArrayBuffer(file);
};

const handleSubmit = async () => {
  if (!fileData) {
    alert('Пожалуйста, выберите файл!');
    return;
  }

  // Отладка данных перед отправкой
  console.log('Отправляемые данные:', fileData);

  try {
    const response = await axios.post('http://192.168.6.229:8000/api/upload-batch/', { data: fileData }, {
      headers: getAuthHeaders(), // Добавляем заголовки аутентификации
    });
    console.log('Ответ сервера:', response.data);
    alert('Данные успешно внесены!');
    setShowModal(false);
    fetchProducts(1); // Сбрасываем на первую страницу после отправки
  } catch (error) {
    console.error('Ошибка при внесении данных:', error);
    alert('Ошибка при внесении данных!');
  }
};


  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="admin-products-table">
      <h2>Admin Products</h2>
  
      {/* Кнопка для открытия модального окна */}
      <button className="upload-button" onClick={() => setShowModal(true)}>Внесение данных</button>
  
      <table>
        <thead>
          <tr>
            <th>Штрихкод</th>
            <th>ID Категории</th>
            <th>Название категории</th>
            <th>ID Продавца</th>
            <th>Дата приемки</th>
            <th>Дата отправки</th>
            <th>Товаровед приемки</th>
            <th>Товаровед отправки</th>
            <th>Остаток на складе</th>
            <th>Ячейка</th>
            <th>Заявка (номер)</th>
            <th>Накладная (номер)</th>
            <th>Статус движения товара</th>
            <th>Фотограф</th>
            <th>Ретушер</th>
            <th>Статус заявки</th>
            <th>Статус ретуши</th>
            <th>Ссылка на исходники</th>
            <th>Ссылка на обработанные файлы</th>
          </tr>
        </thead>
        <tbody>
            {products?.length > 0 ? (
              products.map((product) => (
                <tr key={product.barcode}>
                <td>{product.barcode}</td>
                <td>{product.category_id || 'N/A'}</td>
                <td>{product.category_name || 'N/A'}</td>
                <td>{product.seller || 'N/A'}</td>
                <td>{product.income_date || 'N/A'}</td>
                <td>{product.outcome_date || 'N/A'}</td>
                <td>{product.income_stockman || 'N/A'}</td>
                <td>{product.outcome_stockman || 'N/A'}</td>
                <td>{product.in_stock_sum || 'N/A'}</td>
                <td>{product.cell || 'N/A'}</td>
                <td>{product.request_number || 'N/A'}</td>
                <td>{product.invoice_number || 'N/A'}</td>
                <td>{product.move_status || 'N/A'}</td>
                <td>{product.photographer || 'N/A'}</td>
                <td>{product.retoucher || 'N/A'}</td>
                <td>{product.request_status || 'N/A'}</td>
                <td>{product.photos_link || 'N/A'}</td>
                <td>{product.retouch_link || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="19">No products found</td>
            </tr>
          )}
        </tbody>
      </table>
  
      {/* Пагинация */}
      <div className="pagination-controls">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Предыдущая
        </button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Следующая
        </button>
      </div>
  
      {/* Модальное окно */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowModal(false)}>&times;</span>
            <h2>Загрузка данных</h2>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <button onClick={handleSubmit}>Внести данные</button>
          </div>
        </div>
      )}
    </div>
  );  
};

export default AdminProducts;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './AdminProducts.css';

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
      const response = await axios.get(`http://192.168.1.15:8000/api/products/?page=${page}`);
      console.log('Response Data:', response.data);
  
      if (response.data && response.data.results) {
        setProducts(response.data.results); // Check that 'results' exists
        setTotalPages(Math.ceil(response.data.count / 100)); // Assuming 100 items per page
      } else {
        setProducts([]); // Fallback to an empty array if 'results' is undefined
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

      // Check the parsed data structure
      console.log("Parsed file data:", jsonData);

      setFileData(jsonData);  // Save file data to state
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!fileData) {
      alert('Пожалуйста, выберите файл!');
      return;
    }

    const validData = fileData.slice(1).map((row) => {
      return {
        barcode: row[0], // Штрихкод (обязательный)
        name: row[1], // Наименование (обязательное)
        category_id: Number(row[2]), // ID Категории (обязательный, преобразован в число)
        seller: Number(row[3]), // ID Продавца (обязательный, преобразован в число)
        in_stock_sum: Number(row[4]), // Остаток на складе (обязательный, преобразован в число)
        cell: row[5], // Ячейка (обязательная)
        income_date: row[6] || null, // Дата приемки (необязательная)
        outcome_date: row[7] || null, // Дата отправки (необязательная)
        income_stockman: Number(row[8]) || null, // Товаровед приемки (необязательная)
        outcome_stockman: Number(row[9]) || null, // Товаровед отправки (необязательная)
        move_status: Number(row[10]) || null, // Статус движения товара (необязательная)
        request_number: row[11] || null, // Заявка (номер) (необязательная)
        invoice_number: row[12] || null, // Накладная (номер) (необязательная)
        photographer: Number(row[13]) || null, // Фотограф (необязательная)
        retoucher: Number(row[14]) || null, // Ретушер (необязательная)
        request_status: Number(row[15]) || null, // Статус заявки (необязательная)
        retouch_link: row[16] || null, // Ссылка на обработанные файлы (необязательная)
        photos_link: row[17] || null // Ссылка на исходники (необязательная)
      };
    });

    console.log('Отправляемые данные:', validData);

    // Check required fields
    const invalidRows = validData.filter((row) => !row.barcode || !row.name || !row.category_id || !row.seller || !row.in_stock_sum || !row.cell);

    if (invalidRows.length > 0) {
      alert('Некоторые строки не содержат обязательных полей. Пожалуйста, заполните их.');
      return;
    }

    if (validData.length === 0) {
      alert('Файл пуст или содержит только заголовки.');
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.15:8000/api/products/bulk-upload/', { data: validData });
      console.log('Ответ сервера:', response.data);
      alert('Данные успешно внесены!');
      setShowModal(false);
      fetchProducts(1);  // Reset to the first page after submission
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

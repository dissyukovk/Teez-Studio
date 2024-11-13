import React, { useEffect, useState, useCallback } from 'react';
import productService from '../services/productService';
import './CurrentProductFS.css';

const CurrentProductsFS = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Основные состояния для поиска
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchName, setSearchName] = useState('');

  // Временные состояния для полей поиска
  const [tempBarcode, setTempBarcode] = useState('');
  const [tempName, setTempName] = useState('');

  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [move_status] = useState([3, 25]);

  // Функция для загрузки продуктов
  const fetchProducts = useCallback(async (page = 1, barcode = searchBarcode, name = searchName) => {
    try {
      setLoading(true);
      const response = await productService.getProducts(
        name,
        barcode,
        sortField,
        sortOrder,
        page,
        100,
        move_status
      );

      if (response && response.results) {
        setProducts(response.results);
        setTotalPages(Math.ceil(response.count / 100));
      } else {
        setProducts([]);
      }
      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить продукты');
      setLoading(false);
    }
  }, [searchBarcode, searchName, sortField, sortOrder, move_status]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

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

  const handleSort = (field) => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  // Функция для обработки кнопки поиска
  const handleSearch = () => {
    setSearchBarcode(tempBarcode);
    setSearchName(tempName);
    setCurrentPage(1);
    fetchProducts(1, tempBarcode, tempName);
  };

  return (
    <div className="main-content">
      <h1>Текущие товары на ФС</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={tempBarcode}
          onChange={(e) => setTempBarcode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по наименованию"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
        />
        <button onClick={handleSearch}>Поиск</button>
      </div>

      {loading && <div>Загрузка...</div>}
      {error && <div>{error}</div>}

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('barcode')}>Штрихкод</th>
              <th onClick={() => handleSort('name')}>Наименование</th>
              <th onClick={() => handleSort('cell')}>Ячейка</th>
              <th onClick={() => handleSort('move_status')}>Статус движения</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.barcode}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.cell}</td>
                  <td>{product.move_status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Продукты не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Первая</button>
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Предыдущая</button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Следующая</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Последняя</button>
      </div>
    </div>
  );
};

export default CurrentProductsFS;

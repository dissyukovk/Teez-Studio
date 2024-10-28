import React, { useEffect, useState, useCallback } from 'react';
import productService from '../services/productService';
import './ProductTable.css';
import ModalIncomeComponent from './ModalIncomeComponent';  
import ModalOutcomeComponent from './ModalOutcomeComponent';  
import ProductModalStockman from './ProductModalStockman';  // Импортируем новое модальное окно

const ProductTable = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModalIncome, setShowModalIncome] = useState(false);
  const [showModalOutcome, setShowModalOutcome] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);  // Для показа модального окна товара
  const [selectedBarcode, setSelectedBarcode] = useState(null);  // Хранение выбранного штрихкода

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await productService.getProducts(searchName, searchBarcode, sortField, sortOrder, page);
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
  }, [searchBarcode, searchName, sortField, sortOrder]);

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

  const openModalIncome = () => setShowModalIncome(true);
  const closeModalIncome = () => setShowModalIncome(false);

  const openModalOutcome = () => setShowModalOutcome(true);  
  const closeModalOutcome = () => setShowModalOutcome(false);  
  
  const openProductModal = (barcode) => {  // Открыть модальное окно товара
    setSelectedBarcode(barcode);
    setShowProductModal(true);
  };
  const closeProductModal = () => setShowProductModal(false);  // Закрыть модальное окно товара

  return (
    <div className="main-content">
      <h1>Список товаров</h1>
      <div className="action-buttons">
        <button onClick={openModalIncome} className="primary-button">Начать приемку</button>
        <button onClick={openModalOutcome} className="secondary-button">Начать отправку</button>
      </div>
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
      {loading && <div>Загрузка...</div>}
      {error && <div>{error}</div>}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('barcode')}>Штрихкод</th>
              <th onClick={() => handleSort('name')}>Наименование</th>
              <th onClick={() => handleSort('cell')}>Ячейка</th>
              <th onClick={() => handleSort('category_name')}>Категория</th>
              <th onClick={() => handleSort('in_stock_sum')}>Количество на складе</th>
              <th onClick={() => handleSort('seller')}>Продавец</th>
              <th onClick={() => handleSort('move_status')}>Статус движения</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.barcode} onClick={() => openProductModal(product.barcode)}>  {/* Клик по штрихкоду */}
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.cell}</td>
                  <td>{product.category_name}</td>
                  <td>{product.in_stock_sum}</td>
                  <td>{product.seller}</td>
                  <td>{product.move_status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Продукты не найдены</td>
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

      {/* Модальное окно для приемки товара */}
      {showModalIncome && <ModalIncomeComponent closeModal={closeModalIncome} />}
      
      {/* Модальное окно для отправки товара */}
      {showModalOutcome && <ModalOutcomeComponent closeModal={closeModalOutcome} />}
      
      {/* Модальное окно для информации о продукте */}
      {showProductModal && selectedBarcode && (
        <ProductModalStockman barcode={selectedBarcode} closeModal={closeProductModal} />
      )}
    </div>
  );
};

export default ProductTable;

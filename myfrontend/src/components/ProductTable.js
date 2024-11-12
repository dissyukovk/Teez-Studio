import React, { useEffect, useState, useCallback } from 'react';
import productService from '../services/productService';
import './ProductTable.css';
import ModalIncomeComponent from './ModalIncomeComponent';
import ModalOutcomeComponent from './ModalOutcomeComponent';
import ProductModalStockman from './ProductModalStockman';

const ProductTable = () => {
  const [products, setProducts] = useState([]);
  const [moveStatuses, setMoveStatuses] = useState([]);
  const [stockmen, setStockmen] = useState([]);
  const [selectedMoveStatus, setSelectedMoveStatus] = useState('');
  const [selectedStockman, setSelectedStockman] = useState('');
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
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await productService.getProducts(
        searchName,
        searchBarcode,
        sortField,
        sortOrder,
        page,
        100,
        [selectedMoveStatus],
        selectedStockman
      );

      setProducts(response.results || []);
      setTotalPages(Math.ceil(response.count / 100));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Не удалось загрузить продукты');
      setLoading(false);
    }
  }, [searchName, searchBarcode, sortField, sortOrder, selectedMoveStatus, selectedStockman]);

  // Load filter data and products on component mount and when filters change
  useEffect(() => {
    productService.getMoveStatuses().then(setMoveStatuses).catch(console.error);
    productService.getStockman().then(setStockmen).catch(console.error);
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  const openModalIncome = () => setShowModalIncome(true);
  const closeModalIncome = () => setShowModalIncome(false);

  const openModalOutcome = () => setShowModalOutcome(true);
  const closeModalOutcome = () => setShowModalOutcome(false);

  const openProductModal = (barcode) => {
    setSelectedBarcode(barcode);
    setShowProductModal(true);
  };
  const closeProductModal = () => setShowProductModal(false);

  return (
    <div className="main-content">
      <h1>Список товаров</h1>
      <div className="action-buttons">
        {/* <button onClick={openModalIncome} className="primary-button">Начать приемку</button> */}
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

      <div className="filter-container">
        <select
          value={selectedMoveStatus}
          onChange={(e) => setSelectedMoveStatus(e.target.value)}
        >
          <option value="">Все статусы движения</option>
          {moveStatuses.map(status => (
            <option key={status.id} value={status.id}>{status.name}</option>
          ))}
        </select>

        <select
          value={selectedStockman}
          onChange={(e) => setSelectedStockman(e.target.value)}
        >
          <option value="">Все товароведы</option>
          {stockmen.map(stockman => (
            <option key={stockman.id} value={stockman.id}>{stockman.name}</option>
          ))}
        </select>
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
              <th onClick={() => handleSort('income_date')}>Дата приемки</th>
              <th onClick={() => handleSort('move_status')}>Статус движения</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => (
                <tr key={product.barcode}>
                  <td onClick={() => openProductModal(product.barcode)} style={{ cursor: 'pointer', color: 'blue' }}>
                    {product.barcode}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.cell}</td>
                  <td>{product.category_name}</td>
                  <td>{product.in_stock_sum}</td>
                  <td>{product.seller}</td>
                  <td>{product.income_date ? new Date(product.income_date).toLocaleString() : ""}</td>
                  <td>{product.move_status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">Продукты не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>Первая</button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Предыдущая</button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Следующая</button>
        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>Последняя</button>
      </div>

      {/* Modals */}
      {showModalIncome && <ModalIncomeComponent closeModal={closeModalIncome} />}
      {showModalOutcome && <ModalOutcomeComponent closeModal={closeModalOutcome} />}
      {showProductModal && selectedBarcode && (
        <ProductModalStockman barcode={selectedBarcode} closeModal={closeProductModal} />
      )}
    </div>
  );
};

export default ProductTable;

import React, { useEffect, useState, useCallback } from 'react';
import orderService from '../services/orderService';
import './ProductTable.css';

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    // Fetch statuses on mount
    orderService.getOrderStatuses()
      .then(setStatuses)
      .catch((err) => console.error("Error loading statuses:", err));
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(searchOrderNumber, searchBarcode, selectedStatus, sortField, sortOrder, page);
      if (response && response.results) {
        setOrders(response.results);
        setTotalPages(Math.ceil(response.count / 100));
      } else {
        setOrders([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Не удалось загрузить заказы');
      setLoading(false);
    }
  }, [searchOrderNumber, searchBarcode, selectedStatus, sortField, sortOrder]);  

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  const handleSort = (field) => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const openOrderDetails = (orderNumber) => {
    window.open(`/orders/${orderNumber}`, '_blank');
  };  

  return (
    <div className="main-content">
      <h1>Список заказов</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по номеру заказа"
          value={searchOrderNumber}
          onChange={(e) => setSearchOrderNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        <button onClick={() => fetchOrders(1)}>Поиск</button>
      </div>
      {loading && <div>Загрузка...</div>}
      {error && <div>{error}</div>}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('OrderNumber')}>Номер заказа</th>
              <th onClick={() => handleSort('date')}>Дата</th>
              <th>Создатель</th>
              <th>Статус</th>
              <th>Количество товаров</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.OrderNumber}>
                  <td onClick={() => openOrderDetails(order.OrderNumber)} style={{ cursor: 'pointer', color: 'blue' }}>{order.OrderNumber}</td>
                  <td>{order.date ? new Date(order.date).toLocaleString() : 'Нет даты'}</td>
                  <td>{order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Не указан'}</td>
                  <td>{order.status ? order.status.name : 'Не указан'}</td>
                  <td>{order.total_products}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Заказы не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Первая</button>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Предыдущая</button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Следующая</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Последняя</button>
      </div>
    </div>
  );
};

export default OrderTable;

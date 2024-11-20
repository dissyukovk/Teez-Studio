import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  const navigate = useNavigate();

  useEffect(() => {
    orderService.getOrderStatuses()
      .then(setStatuses)
      .catch((err) => console.error("Error loading statuses:", err));
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(searchOrderNumber, searchBarcode, selectedStatus, sortField, sortOrder, page);

      setOrders(response.results || []);
      setTotalPages(Math.ceil(response.count / 100));
      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить заказы');
      setLoading(false);
    }
  }, [searchOrderNumber, searchBarcode, selectedStatus, sortField, sortOrder]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const goToOrderDetails = (orderNumber) => {
    navigate(`/order_view/${orderNumber}`);
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
        <table className="orders-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('OrderNumber')}>Номер заказа</th>
              <th onClick={() => handleSort('date')}>Дата создания</th>
              <th onClick={() => handleSort('creator')}>Создатель</th>
              <th onClick={() => handleSort('assembly_user')}>Сотрудник сборки</th>
              <th>Начало сборки</th>
              <th onClick={() => handleSort('accept_user')}>Сотрудник приемки</th>
              <th onClick={() => handleSort('accept_date')}>Дата приемки</th>
              <th onClick={() => handleSort('status')}>Статус</th>
              <th>Количество товаров (собрано/общее)</th>
              <th>Принято</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.OrderNumber}>
                  <td onClick={() => goToOrderDetails(order.OrderNumber)} style={{ cursor: 'pointer', color: 'blue' }}>
                    {order.OrderNumber}
                  </td>
                  <td>{order.date ? new Date(order.date).toLocaleString() : 'Нет даты'}</td>
                  <td>{order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Не указан'}</td>
                  <td>{order.assembly_user ? `${order.assembly_user.first_name} ${order.assembly_user.last_name}` : 'Не указан'}</td>
                  <td>{order.assembly_date ? new Date(order.assembly_date).toLocaleString() : 'Не начато'}</td>
                  <td>{order.accept_user ? `${order.accept_user.first_name} ${order.accept_user.last_name}` : 'Не указан'}</td>
                  <td>{order.accept_date ? new Date(order.accept_date).toLocaleString() : 'Нет даты'}</td>
                  <td>{order.status ? order.status.name : 'Не указан'}</td>
                  <td>{order.total_products}</td>
                  <td>{order.accepted_count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">Заказы не найдены</td>
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

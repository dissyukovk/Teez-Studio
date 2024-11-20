import React, { useEffect, useState, useCallback } from 'react';
import orderService from '../services/orderService';
import './okz_OrderTable.css';

const FsOrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch orders with statuses 2 and 3
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(searchOrderNumber, searchBarcode, '3,4,5,6', sortField, sortOrder, page);

      // Add assembled count to each order
      const enrichedOrders = response.results.map(order => ({
        ...order,
        assembledCount: order.products.filter(product => product.assembled).length,
        acceptedCount: order.products.filter(product => product.accepted).length,
        totalProducts: order.products.length,
      }));

      setOrders(enrichedOrders || []);
      setTotalPages(Math.ceil(response.count / 100));
      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить заказы');
      setLoading(false);
    }
  }, [searchOrderNumber, searchBarcode, sortField, sortOrder]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const openOrderDetails = (orderNumber) => {
    window.open(`/fs_orders/${orderNumber}`, '_blank');
  };

  return (
    <div className="main-content">
      <h1>Список заказов ОКЗ для ФС</h1>
      <div className="search-container">
        <input type="text" placeholder="Поиск по номеру заказа" value={searchOrderNumber} onChange={(e) => setSearchOrderNumber(e.target.value)} />
        <input type="text" placeholder="Поиск по штрихкоду" value={searchBarcode} onChange={(e) => setSearchBarcode(e.target.value)} />
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
              <th>Сотрудник сборки</th>
              <th>Начало сборки</th>
              <th>Статус</th>
              <th>Количество товаров</th>
              <th>Принято</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.OrderNumber}>
                  <td onClick={() => openOrderDetails(order.OrderNumber)} style={{ cursor: 'pointer', color: 'blue' }}>{order.OrderNumber}</td>
                  <td>{order.date ? new Date(order.date).toLocaleString() : 'Нет даты'}</td>
                  <td>{order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Не указан'}</td>
                  <td>{order.assembly_user ? `${order.assembly_user.first_name} ${order.assembly_user.last_name}` : 'Не указан'}</td>
                  <td>{order.assembly_date ? new Date(order.assembly_date).toLocaleString() : 'Не начато'}</td>
                  <td>{order.status ? order.status.name : 'Не указан'}</td>
                  <td>{order.totalProducts}</td>
                  <td>{order.acceptedCount}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6">Заказы не найдены</td></tr>
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

export default FsOrderTable;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import './OrderView.css';

const OrderView = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderDetails(orderNumber);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить данные заказа');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="order-view">
      <button className="back-button" onClick={() => navigate('/orders')}>
        Назад
      </button>
      <div className="order-header">
        <h1>Детали заказа №{orderNumber}</h1>
        <div className="order-info">
          <p><strong>Статус:</strong> {order?.status?.name || 'Не указан'}</p>
          <p><strong>Сотрудник сборки:</strong> {order?.assembly_user?.first_name} {order?.assembly_user?.last_name || 'Не указан'}</p>
          <p><strong>Время начала сборки:</strong> {order?.assembly_date ? new Date(order.assembly_date).toLocaleString() : 'Нет даты'}</p>
          <p><strong>Сотрудник приемки:</strong> {order?.accept_user?.first_name} {order?.accept_user?.last_name || 'Не указан'}</p>
          <p><strong>Время начала приемки:</strong> {order?.accept_date ? new Date(order.accept_date).toLocaleString() : 'Нет даты'}</p>
        </div>
      </div>
      <table className="order-products-table">
        <thead>
          <tr>
            <th>Штрихкод</th>
            <th>Наименование</th>
            <th>Номер ячейки</th>
            <th>Статус сборки</th>
            <th>Время сборки</th>
            <th>Статус приемки</th>
            <th>Время приемки</th>
          </tr>
        </thead>
        <tbody>
          {order?.products?.map((product) => (
            <tr key={product.barcode}>
              <td className={product.assembled !== product.accepted ? 'highlight-red' : ''}>
                {product.barcode}
              </td>
              <td>{product.name}</td>
              <td>{product.cell || 'Не указана'}</td>
              <td style={{ color: product.assembled ? 'green' : 'red' }}>
                {product.assembled ? 'Собран' : 'Не собран'}
              </td>
              <td>{product.assembled_date ? new Date(product.assembled_date).toLocaleString() : 'Нет даты'}</td>
              <td style={{ color: product.accepted ? 'green' : 'red' }}>
                {product.accepted ? 'Принят' : 'Не принят'}
              </td>
              <td>{product.accepted_date ? new Date(product.accepted_date).toLocaleString() : 'Нет даты'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderView;

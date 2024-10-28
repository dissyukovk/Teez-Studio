import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '../services/orderService';
import './OrderView.css';

const OrderView = () => {
  const { orderNumber } = useParams();
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

  const handleStatusChange = async () => {
    try {
      await orderService.updateOrderStatus(orderNumber, 4); // Example status ID = 4 for 'Received'
      setOrder((prev) => ({
        ...prev,
        status: { id: 4, name: 'Получен' },
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="order-view">
      <div className="order-header">
        <h1>Детали заказа {orderNumber}</h1>
        <div className="order-status">
          <span>Статус: {order?.status?.name || 'Не указан'}</span>
          <button onClick={handleStatusChange} className="status-button">Получен</button>
        </div>
      </div>
      <table className="order-products-table">
        <thead>
          <tr>
            <th>Штрихкод</th>
            <th>Наименование</th>
            <th>Статус товародвижения</th>
          </tr>
        </thead>
        <tbody>
          {order?.products?.map((product) => (
            <tr key={product.barcode}>
              <td>{product.barcode}</td>
              <td>{product.name}</td>
              <td className={product.movementStatus === 'Принят' ? 'accepted' : ''}>
                {product.movementStatus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderView;

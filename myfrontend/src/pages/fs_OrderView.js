import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import AcceptanceModal from './AcceptanceModal';
import './fs_OrderView.css';

const FsOrderView = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderDetails(orderNumber);
        data.products = data.products.sort((a, b) => (a.cell < b.cell ? -1 : a.cell > b.cell ? 1 : 0));
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить данные заказа');
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  const startAcceptance = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        alert("User ID not found. Please login again.");
        return;
      }

      await orderService.startAcceptance(orderNumber, userId); // Call the backend to start acceptance
      setShowModal(true); // Show the modal after starting acceptance
    } catch (error) {
      console.error('Error starting acceptance:', error);
      alert('Ошибка при начале приемки');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="order-view">
      <button className="back-button" onClick={() => navigate('/okz_list')}>Назад</button>
      <div className="order-header">
        <h1>Детали заказа {orderNumber}</h1>
        <div className="order-status">
          <span>Статус: {order?.status?.name || 'Не указан'}</span>
            <button onClick={startAcceptance} className="status-button">Начать приемку</button>

        </div>
      </div>
      <div className="table-wrapper">
        <table className="order-products-table">
          <thead>
            <tr>
              <th>Штрихкод</th>
              <th>Наименование</th>
              <th>Статус сборки</th>
              <th>Время сборки</th>
              <th>Статус ФС</th>
            </tr>
          </thead>
          <tbody>
            {order?.products?.map((product) => (
              <tr key={product.barcode}>
                <td>{product.barcode}</td>
                <td>{product.name}</td>
                <td style={{ color: product.assembled ? 'green' : 'red' }}>
                  {product.assembled ? 'Собран' : 'Не собран'}
                </td>
                <td>{product.assembled_date ? new Date(product.assembled_date).toLocaleString() : ""}</td>
                <td style={{ color: product.accepted ? 'green' : 'red' }}>
                  {product.accepted ? 'Принят' : 'Не принят'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Acceptance */}
      {showModal && (
        <AcceptanceModal
          orderNumber={orderNumber}
          products={order.products}
          closeModal={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default FsOrderView;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import './okz_OrderView.css';

const OkzOrderView = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  let scanBuffer = ''; // Буфер для хранения сканируемых символов
  let scanTimeout = null; // Таймер для сброса буфера

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Проверка: только цифровые клавиши
      if (!isNaN(event.key) && scanBuffer.length < 13) {
        scanBuffer += event.key;

        // Сбрасываем предыдущий таймер
        if (scanTimeout) clearTimeout(scanTimeout);

        // Устанавливаем новый таймер на 3 секунды
        scanTimeout = setTimeout(() => {
          scanBuffer = ''; // Очистка буфера, если ввод не завершён
        }, 3000);
      }

      // Проверка на завершение ввода штрихкода
      if (event.key === 'Enter' && scanBuffer.length === 13) {
        handleBarcode(scanBuffer);
        scanBuffer = ''; // Очистка буфера после обработки
        if (scanTimeout) clearTimeout(scanTimeout); // Очистка таймера
      }
    };

    // Добавляем обработчик для событий клавиатуры
    window.addEventListener('keydown', handleKeyDown);

    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimeout) clearTimeout(scanTimeout); // Очищаем таймер при размонтировании
    };
  }, []);

  const handleBarcode = async (barcode) => {
    try {
      const response = await orderService.assembleProduct(orderNumber, barcode);
      alert(response.message);
      setScannedCode(barcode);
      window.location.reload();
    } catch (error) {
      console.error('Error assembling product:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  const startAssembly = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert("User ID not found. Please login again.");
      return;
    }
    try {
      await orderService.startAssembly(orderNumber, { user_id: userId });
      window.location.reload();
    } catch (error) {
      console.error('Error starting assembly:', error);
      alert('Ошибка при начале сборки');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="order-view" onKeyDown={(e) => e.preventDefault()}>
      <button className="back-button" onClick={() => navigate('/okz_list')}>Назад</button>
      <div className="order-header">
        <h1>Детали заказа {orderNumber}</h1>
        <div className="order-status">
          <span>Статус: {order?.status?.name || 'Не указан'}</span>
          {order.status.id === 2 && (
            <button onClick={startAssembly} className="status-button">Начать сбор</button>
          )}
        </div>
      </div>
      <div className="table-wrapper">
        <table className="order-products-table">
          <thead>
            <tr>
              <th>Штрихкод</th>
              <th>Наименование</th>
              <th>Ячейка</th>
              <th>Статус сборки</th>
            </tr>
          </thead>
          <tbody>
            {order?.products?.map((product) => (
              <tr key={product.barcode}>
                <td>{product.barcode}</td>
                <td>{product.name}</td>
                <td>{product.cell}</td>
                <td style={{ color: product.assembled ? 'green' : 'red' }}>
                  {product.assembled ? 'Собран' : 'Не собран'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OkzOrderView;

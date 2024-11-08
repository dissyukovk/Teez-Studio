import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import orderService from '../services/orderService';
import './okz_OrderView.css';

const OkzOrderView = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  let scanBuffer = '';
  let scanTimeout = null;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderDetails(orderNumber);
        data.products = data.products.sort((a, b) => (a.cell < b.cell ? -1 : a.cell > b.cell ? 1 : 0));
        
        const assembledCount = data.products.filter(product => product.assembled).length;
        setOrder({ ...data, assembledCount, totalProducts: data.products.length });
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
      if (!isNaN(event.key) && scanBuffer.length < 13) {
        scanBuffer += event.key;
        if (scanTimeout) clearTimeout(scanTimeout);

        scanTimeout = setTimeout(() => {
          scanBuffer = '';
        }, 3000);
      }

      if (event.key === 'Enter' && scanBuffer.length === 13) {
        handleBarcode(scanBuffer);
        scanBuffer = '';
        if (scanTimeout) clearTimeout(scanTimeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimeout) clearTimeout(scanTimeout);
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

  const downloadExcel = () => {
    if (!order) return;

    const ws = XLSX.utils.aoa_to_sheet([
      [`Заказ № ${orderNumber}`], 
      [], 
      ['Штрихкод', 'Наименование', 'Ячейка', 'Статус сборки', 'Время сборки']
    ]);

    order.products.forEach((product) => {
      XLSX.utils.sheet_add_aoa(ws, [[
        product.barcode,
        product.name,
        product.cell,
        product.assembled ? 'Собран' : 'Не собран',
        product.assembled_date ? new Date(product.assembled_date).toLocaleString() : ""
      ]], { origin: -1 });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Заказ');
    const filename = `Заказ №${orderNumber} от ${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const printOrder = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Печать Заказа №${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px;}
            h1 { text-align: center; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;}
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Заказ № ${orderNumber}</h1>
          <div class="order-info">
            <p><strong>Сотрудник сборки:</strong> ${order.assembly_user ? `${order.assembly_user.first_name} ${order.assembly_user.last_name}` : 'Не указан'}</p>
            <p><strong>Количество:</strong> ${order.assembledCount}/${order.totalProducts}</p>
            <p><strong>Статус:</strong> ${order?.status?.name || 'Не указан'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Штрихкод</th>
                <th>Наименование</th>
                <th>Ячейка</th>
                <th>Статус сборки</th>
                <th>Время сборки</th>
              </tr>
            </thead>
            <tbody>
              ${order.products.map(product => `
                <tr>
                  <td>${product.barcode}</td>
                  <td>${product.name}</td>
                  <td>${product.cell}</td>
                  <td>${product.assembled ? 'Собран' : 'Не собран'}</td>
                  <td>${product.assembled_date ? new Date(product.assembled_date).toLocaleString() : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="order-view" onKeyDown={(e) => e.preventDefault()}>
      <button className="back-button" onClick={() => navigate('/okz_list')}>Назад</button>
      <button className="download-button" onClick={downloadExcel}>Скачать Excel</button>
      <button className="print-button" onClick={printOrder}>Печать</button>
      <div className="order-header">
        <h1>Детали заказа {orderNumber}</h1>
        <div className="order-info">
          <p><strong>Сотрудник сборки:</strong> {order?.assembly_user?.first_name} {order?.assembly_user?.last_name || 'Не указан'}</p>
          <p><strong>Количество:</strong> {order?.assembledCount}/{order?.totalProducts}</p>
        </div>
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
              <th>Время сборки</th>
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
                <td>{product.assembled_date ? new Date(product.assembled_date).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OkzOrderView;

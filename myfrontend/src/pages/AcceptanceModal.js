import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import orderService from '../services/orderService'; // Use orderService to handle backend calls
import productService from '../services/productService';
import './AcceptanceModal.css';

const AcceptanceModal = ({ orderNumber, products, closeModal }) => {
  const [scannedBarcodes, setScannedBarcodes] = useState([]);

  // Buffers for barcode scanning
  let scanBuffer = '';
  let scanTimeout = null;

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.preventDefault();

      // Only process numeric keys
      if (!isNaN(event.key) && scanBuffer.length < 13) {
        scanBuffer += event.key;

        if (scanTimeout) clearTimeout(scanTimeout);

        scanTimeout = setTimeout(() => {
          scanBuffer = '';
        }, 1000);
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
  }, [scannedBarcodes, products]);

  const handleBarcode = (newBarcode) => {
    if (scannedBarcodes.find((item) => item.barcode === newBarcode)) {
      alert('Дубликат ШК');
    } else if (products.some((product) => product.barcode === newBarcode)) {
      const product = products.find((p) => p.barcode === newBarcode);
      setScannedBarcodes([...scannedBarcodes, { barcode: newBarcode, name: product.name }]);
    } else {
      alert('Штрихкод не найден в заказе.');
    }
  };

  const handleDeleteBarcode = (barcode) => {
    setScannedBarcodes(scannedBarcodes.filter((item) => item.barcode !== barcode));
  };

  const handleAccept = async () => {
    try {
      const userId = await authService.getCurrentUserId();
      const barcodesToAccept = scannedBarcodes.map((item) => item.barcode);
  
      if (!userId) throw new Error("Не удалось получить идентификатор пользователя.");
  
      // Step 1: Call backend to accept products
      const response = await orderService.acceptProducts(orderNumber, barcodesToAccept);
  
      if (response.missing_barcodes && response.missing_barcodes.length > 0) {
        alert(`Некоторые товары не приняты: ${response.missing_barcodes.join(', ')}`);
      } else {
        // Step 2: Update product status to "Accepted" with user and date in the productService
        await productService.updateProductStatusIncome(barcodesToAccept, userId, 3);
        alert('Все товары успешно приняты');
      }
  
      closeModal();
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при приемке товаров:', error);
      alert('Ошибка при принятии товаров.');
    }
  };  
  
  const handleCreateRequest = async () => {
    try {
      const userId = await authService.getCurrentUserId();
      const barcodesToCreate = scannedBarcodes.map((item) => item.barcode);
  
      if (!userId) throw new Error("Не удалось получить идентификатор пользователя.");
  
      // Step 1: Start acceptance process
      await orderService.startAcceptance(orderNumber, userId);
  
      // Step 2: Call backend to accept products
      const response = await orderService.acceptProducts(orderNumber, barcodesToCreate);
  
      if (response.missing_barcodes && response.missing_barcodes.length > 0) {
        alert(`Некоторые товары не приняты: ${response.missing_barcodes.join(', ')}`);
      } else {
        // Step 3: Create a request
        const requestResponse = await productService.createRequest(barcodesToCreate);
        if (requestResponse && requestResponse.requestNumber) {
          // Step 4: Update product status to "Accepted" with user and date in the productService
          await productService.updateProductStatusIncome(barcodesToCreate, userId, 3);
          alert('Заявка создана и товары приняты.');
        } else {
          throw new Error("Ошибка при создании заявки.");
        }
      }
  
      closeModal();
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при создании заявки и приемке:', error);
      alert('Ошибка при создании заявки и приемке.');
    }
  };  

  return (
    <div className="acceptance-modal">
      <h2>Приемка заказа №{orderNumber}</h2>
      <p>Сканируйте штрихкоды для приемки</p>
      <table className="scanned-table">
        <thead>
          <tr>
            <th>Штрихкод</th>
            <th>Наименование</th>
            <th>Удалить</th>
          </tr>
        </thead>
        <tbody>
          {scannedBarcodes.map((item) => (
            <tr key={item.barcode}>
              <td>{item.barcode}</td>
              <td>{item.name}</td>
              <td>
                <button onClick={() => handleDeleteBarcode(item.barcode)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-buttons">
        <button onClick={handleCreateRequest}>Создать заявку</button>
        <button onClick={handleAccept}>Принять</button>
        <button onClick={closeModal}>Закрыть</button>
      </div>
    </div>
  );
};

export default AcceptanceModal;

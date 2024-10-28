import React, { useState } from 'react';
import productService from '../services/productService';  // Сервис для проверки продуктов
import orderService from '../services/orderService';      // Сервис для создания заказа
import './CreateOrder.css';

const CreateOrder = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateOrder = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Получаем штрихкоды из текста
    const barcodes = barcodeInput.split('\n').map((code) => code.trim()).filter(Boolean);

    if (barcodes.length === 0) {
      setErrorMessage('Введите хотя бы один штрихкод.');
      return;
    }

    try {
      // Проверяем наличие всех штрихкодов в базе данных
      const missingBarcodes = await productService.checkBarcodes(barcodes);
      if (missingBarcodes.length > 0) {
        setErrorMessage(`Штрихкоды отсутствуют в базе данных: ${missingBarcodes.join(', ')}`);
        return;
      }

      // Создаем заказ, если все штрихкоды найдены
      await orderService.createOrder(barcodes);
      setSuccessMessage('Заказ успешно создан.');
      setBarcodeInput(''); // Очищаем поле после успешного создания заказа
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      setErrorMessage('Ошибка при создании заказа. Попробуйте снова.');
    }
  };

  return (
    <div className="create-order-container">
      <h1>Создание заказа (суперадмин)</h1>
      <textarea
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        placeholder="Введите штрихкоды, каждый на новой строке"
        className="barcode-input"
      />
      <button onClick={handleCreateOrder} className="create-button">Создать</button>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default CreateOrder;

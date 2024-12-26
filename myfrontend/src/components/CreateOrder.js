import React, { useState } from 'react';
import productService from '../services/productService';
import orderService from '../services/orderService';
import './CreateOrder.css';

const CreateOrder = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Добавляем состояние для чекбокса приоритета
  const [isPriority, setIsPriority] = useState(false);

  const handleCreateOrder = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Получаем штрихкоды из текстового поля
    const barcodes = barcodeInput.split('\n').map((code) => code.trim()).filter(Boolean);

    if (barcodes.length === 0) {
      setErrorMessage('Введите хотя бы один штрихкод.');
      return;
    }

    try {
      // Проверяем штрихкоды
      const missingBarcodes = await productService.checkBarcodes(barcodes);
      if (missingBarcodes.length > 0) {
        setErrorMessage(`Штрихкоды отсутствуют в базе данных: ${missingBarcodes.join(', ')}`);
        return;
      }

      // Разбиваем штрихкоды на части по 30
      const chunkSize = 30;
      const barcodeChunks = [];
      for (let i = 0; i < barcodes.length; i += chunkSize) {
        barcodeChunks.push(barcodes.slice(i, i + chunkSize));
      }

      // Создаём заказ(ы) для каждой части
      for (const [index, barcodeChunk] of barcodeChunks.entries()) {
        // Передаём приоритет в orderService
        await orderService.createOrder(barcodeChunk, isPriority);
        setSuccessMessage(`Часть ${index + 1} из ${barcodeChunks.length} успешно создана.`);
      }

      setSuccessMessage('Все заказы успешно созданы.');
      setBarcodeInput(''); // Очищаем поле после создания заказов
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      setErrorMessage('Ошибка при создании заказа. Попробуйте снова.');
    }
  };

  return (
    <div className="create-order-container">
      <h1>Создание заказа (суперадмин)</h1>
      <textarea
        className="barcode-input"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        placeholder="Введите штрихкоды, каждый на новой строке"
      />

      {/* Чекбокс Приоритет */}
      <div>
        <input
          type="checkbox"
          id="priorityCheckbox"
          checked={isPriority}
          onChange={(e) => setIsPriority(e.target.checked)}
        />
        <label htmlFor="priorityCheckbox" style={{ marginLeft: '5px' }}>
          Приоритет
        </label>
      </div>

      <button onClick={handleCreateOrder} className="create-button">Создать</button>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default CreateOrder;

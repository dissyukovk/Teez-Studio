import React, { useState } from 'react';
import './ModalIncomeComponent.css';
import productService from '../services/productService';
import invoiceService from '../services/invoiceService';
import authService from '../services/authService';

const ModalOutcomeComponent = ({ closeModal }) => {
  const [newBarcode, setNewBarcode] = useState('');
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddBarcode = async (e) => {
    e.preventDefault();
    if (!newBarcode) return;
  
    const isDuplicate = scannedBarcodes.some((item) => item.barcode === newBarcode);
    if (isDuplicate) {
      setErrorMessage('Дублирование штрихкода. Штрихкод уже просканирован');
      setNewBarcode('');
      return;
    }
  
    try {
      const response = await productService.getLastRequestForBarcode(newBarcode);
      const statusName = response.statusName;
      const requestNumber = response.requestNumber ? response.requestNumber : 'Нет заявок';
      const isRedText = ['Черновик', 'Создана', 'На съемке', 'Проверка фото', 'Распределение ретуши', 'В ретуши', 'Проверка ретуши'].includes(statusName);
  
      setScannedBarcodes((prevBarcodes) => [
        {
          barcode: newBarcode,
          status: statusName,
          requestNumber: requestNumber,
          isRedText: isRedText
        },
        ...prevBarcodes,
      ]);
      setNewBarcode('');
      setErrorMessage('');
    } catch (error) {
      console.error('Ошибка при проверке штрихкода и заявки', error);
      alert('Ошибка при проверке штрихкода. Попробуйте снова!');
      setNewBarcode('');
    }
  };  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddBarcode(e);
    }
  };

  const handleSendProducts = async () => {
    try {
      const barcodesToSend = scannedBarcodes.map(item => item.barcode);
      const userId = await authService.getCurrentUserId();
    
      if (!userId) {
        throw new Error("Не удалось получить идентификатор пользователя.");
      }
  
      const invoiceNumber = await invoiceService.createInvoice(barcodesToSend, userId);
      await productService.updateProductStatusOutcome(barcodesToSend, userId, 4);
    
      alert(`Товары отправлены. Накладная № ${invoiceNumber}`);
      closeModal();
    } catch (error) {
      console.error('Ошибка при отправке товаров и создании накладной:', error);
      alert('Ошибка при отправке товаров и создании накладной.');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const barcodesToSend = scannedBarcodes.map(item => item.barcode);
      const userId = await authService.getCurrentUserId();

      if (!userId) {
        throw new Error("Не удалось получить идентификатор пользователя.");
      }

      // Создаем накладную
      const invoiceNumber = await invoiceService.createInvoice(barcodesToSend, userId);
      await productService.updateProductStatusOutcome(barcodesToSend, userId, 4);
      
      // Открываем страницу печати накладной в новой вкладке
      window.open(`/invoices/${invoiceNumber}`, '_blank');
      closeModal();
    } catch (error) {
      console.error('Ошибка при создании накладной:', error);
      alert('Ошибка при создании накладной.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>Отправка товара</h2>
        <form onSubmit={handleAddBarcode}>
          <input
            type="text"
            placeholder="Введите штрихкод"
            value={newBarcode}
            onChange={(e) => setNewBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button type="button" className="primary-button" onClick={handleAddBarcode}>Добавить штрихкод</button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <div className="barcode-list">
          {scannedBarcodes.map((item, index) => (
            <div key={index} className={`barcode-item ${item.isRedText ? 'red-text' : ''}`}>
              {item.barcode} - {item.requestNumber} - {item.status}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={handleSendProducts} className="green-button">Отправить</button>
          <button onClick={handleCreateInvoice} className="yellow-button">Накладная</button>
          <button onClick={closeModal} className="red-button">Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default ModalOutcomeComponent;

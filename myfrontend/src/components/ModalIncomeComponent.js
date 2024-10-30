import React, { useState } from 'react';
import './ModalIncomeComponent.css';
import productService from '../services/productService'; // Подкорректируйте путь в зависимости от структуры вашего проекта
import authService from '../services/authService';

const ModalIncomeComponent = ({ closeModal }) => {
  const [newBarcode, setNewBarcode] = useState('');
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddBarcode = async (e) => {
    e.preventDefault();
    if (!newBarcode) return;
  
    try {
      const response = await productService.getOrderForBarcode(newBarcode);
  
      const orderNumber = response.orderNumber || 'Нет заказа';
      const statusText = response.isComplete ? 'Можно отправлять' : 'Не завершена';
  
      setScannedBarcodes((prevBarcodes) => [
        { barcode: newBarcode, status: statusText, orderNumber: orderNumber },
        ...prevBarcodes,
      ]);
  
      setNewBarcode('');
      setErrorMessage('');
    } catch (error) {
      console.error('Ошибка при проверке штрихкода и заказа', error);
      setErrorMessage('Ошибка при проверке штрихкода. Попробуйте снова!');
      setNewBarcode('');
    }
  };  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddBarcode(e);
    }
  };

  const handleAccept = async () => {
    try {
      const barcodesToAccept = scannedBarcodes.map(item => item.barcode);
      const userId = await authService.getCurrentUserId(); // Получаем текущий ID пользователя
    
      if (!userId) {
        throw new Error("Не удалось получить идентификатор пользователя.");
      }
  
      // Обновляем статусы на "Принят" (например, статус 3) и записываем пользователя и дату
      await productService.updateProductStatusIncome(barcodesToAccept, userId, 3);  // Используем правильную функцию для приемки
    
      alert('Товары приняты');
      closeModal();  // Закрываем модальное окно после успешной приемки
    } catch (error) {
      console.error('Ошибка при приемке товаров:', error);
      alert('Ошибка при принятии товаров.');
    }
  };
  
  const handleCreateRequest = async () => {
    try {
        const barcodesToCreate = scannedBarcodes.map(item => item.barcode);
        const userId = await authService.getCurrentUserId();
        if (!userId) throw new Error("Не удалось получить идентификатор пользователя.");

        const response = await productService.createRequest(barcodesToCreate);
        if (response && response.requestNumber) {
            await productService.updateProductStatusIncome(barcodesToCreate, userId, 3);
            alert('Заявка создана и товары приняты.');
            closeModal();
        } else {
            throw new Error("Ошибка при создании заявки.");
        }
    } catch (error) {
        console.error('Ошибка при создании заявки и приемке:', error);
        alert('Ошибка при создании заявки и приемке.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>Прием и отправка товара</h2>
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

        {/* Добавленный счетчик количества товаров */}
        <p>Товаров: {scannedBarcodes.length}</p>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <div className="barcode-list">
          {scannedBarcodes.map((item, index) => (
            <div key={index} className="barcode-item">
              {item.barcode} - {item.orderNumber}
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button onClick={handleCreateRequest} className="yellow-button">Создать заявку</button>
          <button onClick={handleAccept} className="green-button">Принять</button>
        </div>
        <button onClick={closeModal} className="red-button">Закрыть</button>
      </div>
    </div>
  );
};

export default ModalIncomeComponent;

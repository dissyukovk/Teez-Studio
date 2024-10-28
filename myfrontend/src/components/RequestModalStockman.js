import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService'; // Импортируем requestService
import './Modal.css'; // Стили для модального окна

const RequestModalStockman = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]); // Список штрихкодов в заявке
  const [newBarcode, setNewBarcode] = useState(''); // Поле для добавления нового штрихкода
  const [status, setStatus] = useState(''); // Статус заявки
  const [errorMessage, setErrorMessage] = useState(''); // Сообщения об ошибках

  const [addedBarcodes, setAddedBarcodes] = useState([]); // Список добавленных штрихкодов
  const [removedBarcodes, setRemovedBarcodes] = useState([]); // Список удаленных штрихкодов

  // Получаем данные о заявке при открытии модального окна
  useEffect(() => {
    console.log("Загружаем детали для заявки: ", requestNumber);  // Логирование
    if (isOpen && requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
        })
        .catch(error => {
          console.error('Error fetching request details:', error);
        });
    }
  }, [isOpen, requestNumber]);

    // Функция для удаления штрихкода
    const handleRemoveBarcode = (barcodeToRemove) => {
        setBarcodes((prevBarcodes) => {
        const updatedBarcodes = prevBarcodes.filter(barcode => barcode.barcode !== barcodeToRemove);
        
        // Добавляем в список удаленных, только если штрихкода там еще нет
        setRemovedBarcodes((prevRemoved) => {
            if (!prevRemoved.includes(barcodeToRemove)) {
            return [...prevRemoved, barcodeToRemove];
            }
            return prevRemoved;
        });

        return updatedBarcodes;
        });
    };


  // Функция для добавления штрихкода
  const handleAddBarcode = () => {
    if (!newBarcode) return;
  
    // Проверяем, есть ли уже этот штрихкод в заявке
    if (barcodes.some(barcode => barcode.barcode === newBarcode)) {
      setErrorMessage('Штрихкод уже есть в этой заявке');
      return;
    }
  
    // Запрашиваем данные по штрихкоду
    requestService.getBarcodeDetails(newBarcode)
      .then(response => {
        if (!response.exists) {
          setErrorMessage('Штрихкод не найден');
          return;
        }
  
        // Добавляем только штрихкод в список добавленных
        setAddedBarcodes(prevAdded => [...prevAdded, newBarcode]);
  
        // Обновляем список штрихкодов
        const newBarcodeEntry = {
          barcode: newBarcode,
          name: response.name,
          movementStatus: response.movementStatus
        };
        setBarcodes(prevBarcodes => [newBarcodeEntry, ...prevBarcodes]);
        setNewBarcode(''); // Очищаем поле ввода
        setErrorMessage(''); // Очищаем сообщения об ошибках
      })
      .catch(error => {
        console.error('Error fetching barcode details:', error);
        setErrorMessage('Ошибка при получении данных штрихкода');
      });
  };  

  // Сохраняем изменения в заявке
  const handleSave = () => {
    console.log('Сохраняем штрихкоды:', { addedBarcodes, removedBarcodes });

    requestService.updateRequest(requestNumber, addedBarcodes, removedBarcodes)
      .then(() => {
        onClose(); // Закрываем модальное окно после сохранения
      })
      .catch(error => {
        console.error('Error saving request changes:', error);
      });
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Заявка №{requestNumber}</h2>
          <p>Статус: {status}</p>

          <div className="barcodes-list">
            <h3>Товары:</h3>
            {barcodes.map(barcode => (
              <div key={barcode.barcode} className="barcode-item">
                <span>{barcode.barcode} - {barcode.name} - {barcode.movementStatus}</span>
                <button className="remove-btn" onClick={() => handleRemoveBarcode(barcode.barcode)}>❌</button>
              </div>
            ))}
          </div>

          <div className="add-barcode">
            <h3>Добавить штрихкод:</h3>
            <input
              type="text"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              placeholder="Введите штрихкод"
            />
            <button onClick={handleAddBarcode}>Добавить</button>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="save-btn" onClick={handleSave}>СОХРАНИТЬ</button>
            <button className="cancel-btn" onClick={onClose}>ОТМЕНИТЬ</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalStockman;

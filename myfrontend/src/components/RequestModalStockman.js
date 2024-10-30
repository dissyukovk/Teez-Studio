import React, { useState, useEffect, useRef } from 'react';
import requestService from '../services/requestService'; // Импортируем requestService
import './RequestModalStockman.css';

const RequestModalStockman = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [newBarcode, setNewBarcode] = useState('');
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [addedBarcodes, setAddedBarcodes] = useState([]);
  const [removedBarcodes, setRemovedBarcodes] = useState([]);
  const modalContentRef = useRef(null);

  useEffect(() => {
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

  const handleRemoveBarcode = (barcodeToRemove) => {
    setBarcodes((prevBarcodes) => prevBarcodes.filter(barcode => barcode.barcode !== barcodeToRemove));
    setRemovedBarcodes((prevRemoved) => (!prevRemoved.includes(barcodeToRemove) ? [...prevRemoved, barcodeToRemove] : prevRemoved));
  };

  const handleAddBarcode = () => {
    if (!newBarcode) return;
    if (barcodes.some(barcode => barcode.barcode === newBarcode)) {
      setErrorMessage('Штрихкод уже есть в этой заявке');
      return;
    }
    requestService.getBarcodeDetails(newBarcode)
      .then(response => {
        if (!response.exists) {
          setErrorMessage('Штрихкод не найден');
          return;
        }
        setAddedBarcodes(prevAdded => [...prevAdded, newBarcode]);
        setBarcodes(prevBarcodes => [{ barcode: newBarcode, name: response.name, movementStatus: response.movementStatus }, ...prevBarcodes]);
        setNewBarcode('');
        setErrorMessage('');
      })
      .catch(error => {
        console.error('Error fetching barcode details:', error);
        setErrorMessage('Ошибка при получении данных штрихкода');
      });
  };

  const handleSave = () => {
    requestService.updateRequest(requestNumber, addedBarcodes, removedBarcodes)
      .then(() => onClose())
      .catch(error => console.error('Error saving request changes:', error));
  };

  // Функция печати с инлайн-стилями для страницы печати
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Печать Заявки</title>
          <style>
            /* Основные стили для печати */
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: Arial, sans-serif;
              padding: 40px;
              margin: 0;
            }
            .modal-content {
              width: 100%;
              max-width: 600px;
              font-size: 14px;
              line-height: 1.8;
              text-align: left;
            }
            .header-section {
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 30px; /* Отступ снизу для отделения */
              display: block;
            }
            .barcodes-list {
              width: 100%;
              margin-top: 30px; /* Отступ сверху для отделения от заголовка */
            }
            .barcode-item {
              margin-bottom: 10px;
              font-size: 12px;
            }
            /* Скрытие элементов, не нужных для печати */
            .remove-btn, .modal-actions, .add-barcode {
              display: none;
            }
            h2 {
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            h3 {
              margin: 0 0 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="modal-content">
            <div class="header-section">
              <h2>Заявка №${requestNumber}</h2>
              <p>Статус: ${status}</p>
            </div>
            <div class="barcodes-list">
              <h3>Товары:</h3>
              ${barcodes.map(barcode => `<div class="barcode-item">${barcode.barcode} - ${barcode.name} - ${barcode.movementStatus}</div>`).join('')}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };
  
  

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content" ref={modalContentRef}>
          <h2>Заявка №{requestNumber}</h2>
          <p>Статус: {status}</p>

          <div className="barcodes-list">
            <h3>Товары:</h3>
            <div className="barcode-table-header">
              <span>Штрихкод</span>
              <span>Наименование</span>
              <span>Статус движения</span>
            </div>
            {barcodes.map(barcode => (
              <div key={barcode.barcode} className="barcode-item">
                <span>{barcode.barcode}</span>
                <span>{barcode.name}</span>
                <span>{barcode.movementStatus}</span>
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
            <button className="print-btn" onClick={handlePrint}>ПЕЧАТЬ</button> {/* Кнопка печати */}
            <button className="cancel-btn" onClick={onClose}>ОТМЕНИТЬ</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalStockman;

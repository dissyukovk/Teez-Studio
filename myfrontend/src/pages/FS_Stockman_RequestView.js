import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import requestService from '../services/requestService'; // Importing requestService
import './FS_RequestView.css';

const FSStockmanRequestView = () => {
  const { requestNumber } = useParams(); // Retrieve requestNumber from the URL
  const navigate = useNavigate();
  const [barcodes, setBarcodes] = useState([]);
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [addedBarcodes, setAddedBarcodes] = useState([]);
  const [removedBarcodes, setRemovedBarcodes] = useState([]);
  const barcodeInputRef = useRef(null); // Reference for the hidden input

  useEffect(() => {
    if (requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
        })
        .catch(error => {
          setErrorMessage('Ошибка при получении данных заявки');
        });
    }
  }, [requestNumber]);

  const handleRemoveBarcode = (barcodeToRemove) => {
    setBarcodes(prevBarcodes => prevBarcodes.filter(barcode => barcode.barcode !== barcodeToRemove));
    setRemovedBarcodes(prevRemoved => (!prevRemoved.includes(barcodeToRemove) ? [...prevRemoved, barcodeToRemove] : prevRemoved));
  };

  const handleAddBarcode = (newBarcode) => {
    if (barcodes.some(barcode => barcode.barcode === newBarcode)) {
      alert('Штрихкод уже есть в этой заявке');
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
        setErrorMessage('');
      })
      .catch(error => {
        setErrorMessage('Ошибка при получении данных штрихкода');
      });
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const scannedBarcode = e.target.value.trim();
      e.preventDefault(); // Prevent default form submission
      handleAddBarcode(scannedBarcode);
      e.target.value = ''; // Clear input after processing
    }
  };

  const activateBarcodeScanner = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent any default action that might cause a reload
    try {
      await requestService.updateRequest(requestNumber, addedBarcodes, removedBarcodes);
      alert('Товары успешно сохранены в заявке!');
      setAddedBarcodes([]);
      setRemovedBarcodes([]);
    } catch (error) {
      setErrorMessage('Ошибка при сохранении изменений');
      alert('Ошибка при сохранении товаров. Попробуйте еще раз.');
    }
  };
  
  const handleStatusUpdate = async () => {
    try {
      await requestService.updateRequestStatus(requestNumber, 2); // Update status to "Создана"
      setStatus('Создана'); // Update status in UI
    } catch (error) {
      setErrorMessage('Ошибка при обновлении статуса');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Печать Заявки</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; padding: 40px; }
            .request-details { font-weight: bold; font-size: 18px; margin-bottom: 30px; }
            .barcodes-list { width: 100%; margin-top: 20px; }
            .barcode-item { font-size: 12px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="request-details">
            <h2>Заявка №${requestNumber}</h2>
            <p>Статус: ${status}</p>
          </div>
          <div class="barcodes-list">
            <h3>Товары:</h3>
            ${barcodes.map(barcode => `<div class="barcode-item">${barcode.barcode} - ${barcode.name} - ${barcode.movementStatus}</div>`).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fs-request-view">
      <h2>Заявка №{requestNumber}</h2>
      {/* <p>Статус: {status} <button onClick={handleStatusUpdate} className="status-update-btn">Создать</button></p> */}

      <table className="styled-table">
        <thead>
          <tr>
            <th>Штрихкод</th>
            <th>Наименование</th>
            <th>Статус движения</th>
            <th>Удалить</th>
          </tr>
        </thead>
        <tbody>
          {barcodes.map(barcode => (
            <tr key={barcode.barcode}>
              <td>{barcode.barcode}</td>
              <td>{barcode.name}</td>
              <td>{barcode.movementStatus}</td>
              <td><button className="remove-btn" onClick={() => handleRemoveBarcode(barcode.barcode)}>❌</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-barcode">
        <button onClick={activateBarcodeScanner}>Добавить товары</button>
        <input
          type="text"
          ref={barcodeInputRef}
          onKeyDown={handleBarcodeScan}
          style={{ position: 'absolute', left: '-9999px' }} // Hidden input field
        />
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="action-buttons">
        <form onSubmit={handleSave}>
          <button type="submit" className="save-btn">СОХРАНИТЬ</button>
        </form>
        <button className="print-btn" onClick={handlePrint}>ПЕЧАТЬ</button>
      </div>
    </div>
  );
};

export default FSStockmanRequestView;

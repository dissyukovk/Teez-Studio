import React, { useState, useEffect, useRef  } from 'react';
import productService from '../services/productService';
import requestService from '../services/requestService';
import './CreateRequestModal.css';

const CreateRequestModal = ({ closeModal }) => {
  const [newBarcode, setNewBarcode] = useState('');
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestNumber, setRequestNumber] = useState(null); // Добавляем состояние для номера заявки
  const [isRequestCreated, setIsRequestCreated] = useState(false); // Флаг для контроля создания заявки
  const requestCreatedRef = useRef(false);

  useEffect(() => {
    const createDraftRequest = async () => {
      if (requestCreatedRef.current) return; // Если уже был вызов, пропускаем
  
      try {
        const response = await requestService.createDraftRequest();
        setRequestNumber(response.requestNumber);
        requestCreatedRef.current = true; // Устанавливаем флаг
      } catch (error) {
        console.error('Ошибка при создании черновика заявки:', error);
        setErrorMessage('Ошибка при создании черновика заявки');
      }
    };
  
    createDraftRequest();
  }, []);   

  const handleAddBarcode = async (e) => {
    e.preventDefault();
    if (!newBarcode) return;

    const isDuplicate = scannedBarcodes.some((item) => item.barcode === newBarcode);
    if (isDuplicate) {
      alert('Штрихкод уже был отсканирован');
      setNewBarcode('');
      return;
    }

    try {
      const response = await productService.getProductByBarcode(newBarcode);

      if (!response) {
        alert('Штрихкод не найден');
        setNewBarcode('');
        return;
      }

      setScannedBarcodes((prev) => [
        { barcode: newBarcode, moveStatus: response.move_status },
        ...prev,
      ]);
      setNewBarcode('');
      setErrorMessage('');
    } catch (error) {
      alert('Ошибка при проверке штрихкода');
      setNewBarcode('');
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!requestNumber) {
        alert('Заявка не создана. Попробуйте снова.');
        return;
      }
  
      await requestService.finalizeRequest(requestNumber, scannedBarcodes.map((item) => item.barcode));
  
      alert('Заявка успешно создана');
      closeModal();  // Закрываем окно после создания заявки
    } catch (error) {
      alert('Ошибка при создании заявки');
    }
  };  

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>Создание заявки #{requestNumber}</h2>

        {/* Поле для сканирования штрихкодов */}
        <form onSubmit={handleAddBarcode}>
          <input
            type="text"
            placeholder="Введите штрихкод"
            value={newBarcode}
            onChange={(e) => setNewBarcode(e.target.value)}
          />
          <button type="submit" className="primary-button">Добавить</button>
        </form>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* Таблица с отсканированными штрихкодами */}
        <div className="scanned-barcodes-table">
          <table>
            <thead>
              <tr>
                <th>№</th> {/* Новый заголовок для нумерации */}
                <th>Штрихкод</th>
                <th>Статус движения товара</th>
              </tr>
            </thead>
            <tbody>
              {scannedBarcodes.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td> {/* Добавляем нумерацию строк */}
                  <td>{item.barcode}</td>
                  <td>{item.moveStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {/* Кнопка для создания заявки */}
        <button onClick={handleCreateRequest} className="primary-button">Создать</button>
        <button onClick={closeModal} className="secondary-button">Закрыть</button>
      </div>
    </div>
  );
};

export default CreateRequestModal;

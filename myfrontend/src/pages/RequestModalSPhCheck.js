import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalSPhCheck = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [photographerId, setPhotographerId] = useState('');
  const [status, setStatus] = useState('');
  const [photographers, setPhotographers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [comment, setComment] = useState('');
  const [photosLink, setPhotosLink] = useState('');
  const [photographerName, setPhotographerName] = useState(''); // Строка для имени фотографа

  useEffect(() => {
    if (isOpen && requestNumber) {
      // Получаем детали заявки
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          console.log('Response from getRequestDetails:', response); // Выводим полный ответ в консоль
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setPhotographerId(response.photographer_id || '');
          
          // Убедимся, что приходят данные о фотографе
          const firstName = response.photographer_first_name || '';
          const lastName = response.photographer_last_name || '';
          console.log('Photographer first name:', firstName); // Выводим имя фотографа в консоль
          console.log('Photographer last name:', lastName);   // Выводим фамилию фотографа в консоль
          
          setPhotographerName(
            `${firstName} ${lastName}`.trim() || 'Не назначен'
          );
          setComment(response.comment || '');
          setPhotosLink(response.photos_link || '');
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });

      // Получаем список фотографов
      requestService.getPhotographers()
        .then(response => {
          setPhotographers(response);
        })
        .catch(error => {
          console.error('Ошибка при загрузке фотографов:', error);
        });
    }
  }, [isOpen, requestNumber]);

  const handleAccept = () => {
    if (!photographerId) {
      setErrorMessage('Выберите фотографа');
      return;
    }

    requestService.updateRequestStatus(requestNumber, 5)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при обновлении статуса:', error);
      });
  };

  const markAsReshoot = () => {
    if (!photographerId) {
      setErrorMessage('Выберите фотографа');
      return;
    }

    requestService.assignPhotographer(requestNumber, photographerId, comment)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при назначении на пересъем:', error);
      });
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка №{requestNumber}</h2>
            <button className="approve-btn" onClick={handleAccept}>Принять</button>
          </div>
          <p>Статус: {status}</p>
          <p>Фотограф: {photographerName}</p> {/* Отображаем имя фотографа */}

          <div className="link-section">
            <h3>Ссылка на исходники:</h3>
            <a href={photosLink} target="_blank" rel="noopener noreferrer">
              <button className="reference-btn">Ссылка</button>
            </a>
          </div>

          <div className="barcodes-list">
            <h3>Товары:</h3>
            {barcodes.map((barcode) => (
              <div key={barcode.barcode} className="barcode-item">
                <span>
                  {barcode.barcode} - {barcode.name} - {barcode.category_name}
                </span>
                <a href={barcode.category_reference_link} target="_blank" rel="noopener noreferrer">
                  <button className="reference-btn">Референс</button>
                </a>
              </div>
            ))}
          </div>

          <div className="photographer-section">
            <h3>Фотограф:</h3>
            <select
              value={photographerId}
              onChange={(e) => setPhotographerId(e.target.value)}
            >
              <option value="">Выберите фотографа</option>
              {photographers.map((photographer) => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.first_name} {photographer.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="comment-section">
            <h3>Комментарий:</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий"
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="reshoot-btn" onClick={markAsReshoot}>Пересъем</button>
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalSPhCheck;

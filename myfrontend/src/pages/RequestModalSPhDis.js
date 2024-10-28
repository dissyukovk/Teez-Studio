import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalSPhDis = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [photographerId, setPhotographerId] = useState('');
  const [status, setStatus] = useState('');
  const [photographers, setPhotographers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [comment, setComment] = useState(''); // Новое состояние для комментария

  useEffect(() => {
    if (isOpen && requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setComment(response.comment || ''); // Загружаем комментарий, если он есть
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });

      requestService.getPhotographers()
        .then(response => {
          setPhotographers(response);
        })
        .catch(error => {
          console.error('Ошибка при загрузке фотографов:', error);
        });
    }
  }, [isOpen, requestNumber]);

  const assignPhotographer = () => {
    if (!photographerId) {
      setErrorMessage('Выберите фотографа');
      return;
    }

    requestService.assignPhotographer(requestNumber, photographerId, comment) // Передаем комментарий
      .then(() => {
        onClose(); // Закрываем модальное окно после назначения
      })
      .catch(error => {
        console.error('Ошибка при назначении фотографа:', error);
      });
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Заявка №{requestNumber}</h2>
          <p>Статус: {status}</p>

          <div>
            <h3>Фотограф:</h3>
            <select value={photographerId} onChange={(e) => setPhotographerId(e.target.value)}>
              <option value="">Выберите фотографа</option>
              {photographers.map((photographer) => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.first_name} {photographer.last_name}
                </option>
              ))}
            </select>
            <button onClick={assignPhotographer}>Назначить</button>
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
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalSPhDis;

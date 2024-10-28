import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalPh = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [photosLink, setPhotosLink] = useState(''); // Ссылка на фото
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && requestNumber) {
      // Получаем детали заявки
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setComment(response.comment || '');
          setPhotosLink(response.photos_link || '');
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });
    }
  }, [isOpen, requestNumber]);

  const handleMarkForReview = () => {
    // Проверяем, заполнено ли поле ссылки
    if (!photosLink) {
      alert("Вставьте ссылку на фото"); // Системный алерт
      return;
    }
  
    // Если ссылка заполнена, обновляем статус заявки
    requestService.updateRequestStatus(requestNumber, 4, photosLink)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при обновлении статуса:', error);
        setErrorMessage('Не удалось обновить статус');
      });
  };  

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка №{requestNumber}</h2>
          </div>
          <p>Статус: {status}</p>

          <div className="barcodes-list">
            <h3>Товары:</h3>
            {barcodes.map((barcode) => (
              <div key={barcode.barcode} className="barcode-item">
                <span>
                  {barcode.barcode} - {barcode.name} - {barcode.category_name}
                </span>
                {barcode.category_reference_link && (
                  <a href={barcode.category_reference_link} target="_blank" rel="noopener noreferrer">
                    <button className="reference-btn">Референс</button>
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="comment-section">
            <h3>Комментарий заявки:</h3>
            <p>{comment}</p>
          </div>

          <div className="link-section">
            <h3>Ссылка на фото:</h3>
            <input
              type="text"
              value={photosLink}
              onChange={(e) => setPhotosLink(e.target.value)}
              placeholder="Введите ссылку на фото"
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="reshoot-btn" onClick={handleMarkForReview}>На проверку</button>
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalPh;

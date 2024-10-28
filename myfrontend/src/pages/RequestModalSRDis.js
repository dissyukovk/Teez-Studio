import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalSRDis = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [retoucherId, setRetoucherId] = useState('');
  const [status, setStatus] = useState('');
  const [retouchers, setRetouchers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [comment, setRetoucherComment] = useState('');
  const [retoucherName, setRetoucherName] = useState(''); // Переменная для имени ретушера
  const [photosLink, setPhotosLink] = useState(''); // Переменная для ссылки на исходники

  useEffect(() => {
    if (isOpen && requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          console.log('Response from getRequestDetails:', response); // Отладочная информация
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setRetoucherId(response.retoucher_id || '');
          setRetoucherName(`${response.retoucher_first_name || ''} ${response.retoucher_last_name || ''}`);
          setRetoucherComment(response.sr_comment || ''); // Загружаем текущий комментарий, если есть
          setPhotosLink(response.photos_link || ''); // Загружаем ссылку на исходники
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });

      requestService.getRetouchers()
        .then(response => {
          setRetouchers(response);
        })
        .catch(error => {
          console.error('Ошибка при загрузке ретушеров:', error);
        });
    }
  }, [isOpen, requestNumber]);

  const handleAssign = () => {
    if (!retoucherId) {
      setErrorMessage('Выберите ретушера');
      return;
    }

    requestService.assignRetoucher(requestNumber, retoucherId, comment)  // Передаем комментарий
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при назначении ретушера:', error);
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
          <p>Текущий ретушер: {retoucherName}</p>

          {/* Кнопка со ссылкой на исходники, если она доступна и не равна 'N/A' */}
          {photosLink && photosLink !== 'N/A' && (
            <button
              className="link-button"
              onClick={() => window.open(photosLink, '_blank')}
            >
              Ссылка на исходники
            </button>
          )}

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

          <div className="retoucher-section">
            <h3>Ретушер:</h3>
            <select
              value={retoucherId}
              onChange={(e) => setRetoucherId(e.target.value)}
            >
              <option value="">Выберите ретушера</option>
              {retouchers.map((retoucher) => (
                <option key={retoucher.id} value={retoucher.id}>
                  {retoucher.first_name} {retoucher.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="comment-section">
            <h3>Комментарий:</h3>
            <textarea
              value={comment}
              onChange={(e) => setRetoucherComment(e.target.value)}
              placeholder="Введите комментарий"
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="assign-btn" onClick={handleAssign}>Назначить</button>
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalSRDis;

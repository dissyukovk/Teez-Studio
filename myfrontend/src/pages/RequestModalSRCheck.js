import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalSRCheck = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [retoucherId, setRetoucherId] = useState('');
  const [status, setStatus] = useState('');
  const [retouchers, setRetouchers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [comment, setComment] = useState('');
  const [retoucherName, setRetoucherName] = useState('');
  const [photosLink, setPhotosLink] = useState(''); // Добавляем состояние для ссылки на исходники

  useEffect(() => {
    if (isOpen && requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setRetoucherId(response.retoucher_id || '');
          setRetoucherName(`${response.retoucher_first_name || ''} ${response.retoucher_last_name || ''}`);
          setComment(response.sr_comment || '');
          setPhotosLink(response.photos_link || ''); // Сохраняем ссылку на исходники
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

  const handleAccept = () => {
    requestService.updateRequestStatus(requestNumber, 8)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при принятии заявки:', error);
      });
  };

  const handleReshoot = () => {
    if (!retoucherId) {
      setErrorMessage('Выберите ретушера');
      return;
    }

    requestService.assignRetoucher(requestNumber, retoucherId, comment)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при назначении ретушера на правки:', error);
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
          
          {/* Кнопка со ссылкой на исходники */}
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
            <table className="barcode-table">
              <thead>
                <tr>
                  <th>Штрихкод</th>
                  <th>Наименование</th>
                  <th>Категория</th>
                  <th>Ссылка на референс</th>
                  <th>Статус ретуши</th>
                  <th>Ссылка на обработанные фото</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.map((barcode) => (
                  <tr key={barcode.barcode}>
                    <td>{barcode.barcode}</td>
                    <td>{barcode.name}</td>
                    <td>{barcode.category_name}</td>
                    <td>
                      <a href={barcode.category_reference_link} target="_blank" rel="noopener noreferrer">
                        <button className="reference-btn">Референс</button>
                      </a>
                    </td>
                    <td>{barcode.retouch_status_name}</td>
                    <td>
                      {barcode.retouch_link && barcode.retouch_link !== 'N/A' ? (
                        <a href={barcode.retouch_link} target="_blank" rel="noopener noreferrer">
                          <button className="reference-btn">Обработанные фото</button>
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий"
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="assign-btn" onClick={handleAccept}>Принять</button>
            <button className="reshoot-btn" onClick={handleReshoot}>Правки</button>
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalSRCheck;

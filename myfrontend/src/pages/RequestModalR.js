import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';

const RequestModalR = ({ isOpen, onClose, request }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [retouchStatuses, setRetouchStatuses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [photosLink, setPhotosLink] = useState('');
  const [srComment, setSrComment] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      requestService.getRequestDetails(request.RequestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setPhotosLink(response.photos_link);
          setSrComment(response.sr_comment || '');
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });

      requestService.getRetouchStatuses()
        .then(response => {
          setRetouchStatuses(response);
        })
        .catch(error => {
          console.error('Ошибка при загрузке статусов ретуши:', error);
        });
    }
  }, [isOpen, request]);

  const handleStatusChange = (index, newStatus) => {
    setBarcodes((prev) =>
      prev.map((barcode, i) =>
        i === index ? { ...barcode, retouch_status: newStatus } : barcode
      )
    );
  };

  const handleLinkChange = (index, newLink) => {
    setBarcodes((prev) =>
      prev.map((barcode, i) =>
        i === index ? { ...barcode, retouch_link: newLink } : barcode
      )
    );
  };

  const handleSubmitForReview = () => {
    for (let barcode of barcodes) {
      if (barcode.retouch_status === 2 && !barcode.retouch_link) {
        alert('Вставьте ссылки для готовых товаров.');
        return;
      }
    }

    requestService.updateRetouchStatusesAndLinks(request.RequestNumber, barcodes)
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Ошибка при обновлении статусов и ссылок ретуши:', error);
      });
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка №{request.RequestNumber}</h2>
          </div>
          <p>Статус: {request.status?.name || 'Статус не указан'}</p>
          <p>Ретушер: {request.retoucher_first_name} {request.retoucher_last_name}</p>
          
          <button
            className="link-button"
            onClick={() => window.open(photosLink, '_blank')}
            disabled={!photosLink}
          >
            Ссылка на исходники
          </button>

          <div className="barcodes-list">
            <h3>Товары:</h3>
            {barcodes.map((barcode, index) => (
              <div key={barcode.barcode} className="barcode-item">
                <span>{barcode.barcode} - {barcode.name} - {barcode.category_name}</span>
                <select
                  value={barcode.retouch_status || ''}
                  onChange={(e) => handleStatusChange(index, e.target.value)}
                >
                  <option value="">Выберите статус</option>
                  {retouchStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ссылка на обработанные фото"
                  value={barcode.retouch_link || ''}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="comment-section">
            <h3>Комментарий (SR_Comment):</h3>
            <p>{srComment || 'Комментарий отсутствует'}</p>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="modal-actions">
            <button className="assign-btn" onClick={handleSubmitForReview}>
              Отправить на проверку
            </button>
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalR;

import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './RequestModal.css';

const RequestModalManager = ({ isOpen, onClose, requestNumber }) => {
  const [barcodes, setBarcodes] = useState([]);
  const [status, setStatus] = useState('');
  const [photosLink, setPhotosLink] = useState(''); // Ссылка на исходники

  useEffect(() => {
    if (isOpen && requestNumber) {
      requestService.getRequestDetails(requestNumber)
        .then(response => {
          setBarcodes(response.barcodes);
          setStatus(response.status);
          setPhotosLink(response.photos_link || '');
        })
        .catch(error => {
          console.error('Ошибка при загрузке данных заявки:', error);
        });
    }
  }, [isOpen, requestNumber]);

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка №{requestNumber}</h2>
          </div>
          <p>Статус: {status}</p>
          
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
                  <th>Статус ретуши</th>
                  <th>Ссылка на обработанные фото</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.map((barcode) => (
                  <tr key={barcode.barcode}>
                    <td>{barcode.barcode}</td>
                    <td>{barcode.name}</td>
                    <td>{barcode.retouch_status_name || 'Не указан'}</td> {/* Добавляем статус ретуши */}
                    <td>
                      {barcode.retouch_link && barcode.retouch_link !== 'N/A' ? (
                        <a href={barcode.retouch_link} target="_blank" rel="noopener noreferrer">
                          <button className="reference-btn">Обработанные фото</button>
                        </a>
                      ) : 'Нет данных'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  );
};

export default RequestModalManager;

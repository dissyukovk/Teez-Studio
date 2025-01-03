import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import requestService from '../services/requestService';
import './Requests.css';
import CreateRequestModal from './CreateRequestModal';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchRequestNumber, setSearchRequestNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [newRequestNumber, setNewRequestNumber] = useState('');

  // Поля для временного хранения значений полей поиска
  const [tempRequestNumber, setTempRequestNumber] = useState('');
  const [tempBarcode, setTempBarcode] = useState('');
  const [tempStatus, setTempStatus] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    requestService.getRequestStatuses()
      .then(response => setStatuses(response))
      .catch(error => console.error('Ошибка при загрузке статусов:', error));
  }, []);

  const fetchRequests = useCallback(async (page = 1, requestNumber = searchRequestNumber, barcode = searchBarcode, status = selectedStatus) => {
    try {
      setLoading(true);
      const response = await requestService.getRequests({
        requestNumber,
        barcode,
        status,
        sortField,
        sortOrder,
        page
      });

      if (response && response.results) {
        setRequests(response.results);
        setTotalPages(Math.ceil(response.count / 100));
      } else {
        setRequests([]);
      }

      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить заявки');
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, fetchRequests]);

  const handleSort = (field) => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const openRequestPage = (requestNumber) => {
    navigate(`/fs_stockman_requestview/${requestNumber}`);
  };

  const openCreateRequestModal = () => {
    if (!showCreateRequestModal) {
      setShowCreateRequestModal(true);
    }
  };
  

  const closeCreateRequestModal = () => {
    setShowCreateRequestModal(false);
  };

  // Обработка поиска по нажатию кнопки
  const handleSearch = () => {
    setSearchRequestNumber(tempRequestNumber);
    setSearchBarcode(tempBarcode);
    setSelectedStatus(tempStatus);
    setCurrentPage(1);
    fetchRequests(1, tempRequestNumber, tempBarcode, tempStatus);
  };

  return (
    <div className="content">
      <h1>Заявки</h1>

      <button onClick={openCreateRequestModal} className="primary-button">Создать заявку</button>

      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по номеру заявки"
          value={tempRequestNumber}
          onChange={(e) => setTempRequestNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={tempBarcode}
          onChange={(e) => setTempBarcode(e.target.value)}
        />

        <select
          value={tempStatus}
          onChange={(e) => setTempStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>

        <button onClick={handleSearch}>Поиск</button>
      </div>

      {loading && <div>Загрузка...</div>}
      {error && <div>{error}</div>}

      <div className="table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('RequestNumber')}>Номер заявки</th>
              <th onClick={() => handleSort('creation_date')}>Дата создания</th>
              <th onClick={() => handleSort('stockman')}>Товаровед</th>
              <th onClick={() => handleSort('photographer')}>Фотограф</th>
              <th onClick={() => handleSort('retoucher')}>Ретушер</th>
              <th onClick={() => handleSort('status')}>Статус</th>
              <th onClick={() => handleSort('total_products')}>Количество товаров</th>
            </tr>
          </thead>
          <tbody>
            {requests && requests.length > 0 ? (
              requests.map((request, index) => (
                <tr key={request.RequestNumber || index}>
                  <td onClick={() => openRequestPage(request.RequestNumber)}>{request.RequestNumber}</td>
                  <td>{request.creation_date}</td>
                  <td>{request.stockman ? `${request.stockman.first_name} ${request.stockman.last_name}` : 'Не назначен'}</td>
                  <td>{request.photographer_first_name ? `${request.photographer_first_name} ${request.photographer_last_name}` : 'Не назначен'}</td>
                  <td>{request.retoucher_first_name ? `${request.retoucher_first_name} ${request.retoucher_last_name}` : 'Не назначен'}</td>
                  <td>{request.status ? request.status.name : 'Не назначен'}</td>
                  <td>{request.total_products}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Заявки не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Первая</button>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Предыдущая</button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Следующая</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Последняя</button>
      </div>

      {showCreateRequestModal && (
        <CreateRequestModal
          closeModal={closeCreateRequestModal}
          requestNumber={newRequestNumber}
        />
      )}
    </div>
  );
};

export default Requests;

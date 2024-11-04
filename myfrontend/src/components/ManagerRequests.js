import React, { useEffect, useState, useCallback } from 'react';
import requestService from '../services/requestService';
import './Requests.css';
import RequestModalManager from '../pages/RequestModalManager';

const ManagerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchRequestNumber, setSearchRequestNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchProductName, setSearchProductName] = useState(''); // новое состояние для поиска по наименованию продукта
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState(''); // для поля сортировки
  const [sortOrder, setSortOrder] = useState('asc'); // для порядка сортировки

  // Загрузка списка статусов
  useEffect(() => {
    requestService.getRequestStatuses()
      .then(response => setStatuses(response))
      .catch(error => console.error('Ошибка при загрузке статусов:', error));
  }, []);

  const fetchRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await requestService.getRequests({
        requestNumber: searchRequestNumber,
        barcode: searchBarcode,
        productName: searchProductName, // добавляем в параметры запроса
        status: selectedStatus,
        sortField: sortField,
        sortOrder: sortOrder,
        page: page
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
  }, [searchRequestNumber, searchBarcode, searchProductName, selectedStatus, sortField, sortOrder]);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, fetchRequests]);

  const openModal = (requestNumber) => {
    setSelectedRequestNumber(requestNumber);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestNumber(null);
    fetchRequests(currentPage); // Обновляем список после закрытия модального окна
  };

  const handleSort = (field) => {
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortField(field);
    setCurrentPage(1);
  };

  return (
    <div className="content">
      <h1>Заявки (Менеджер)</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по номеру заявки"
          value={searchRequestNumber}
          onChange={(e) => setSearchRequestNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по наименованию товара"
          value={searchProductName}
          onChange={(e) => setSearchProductName(e.target.value)}
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        <button onClick={() => fetchRequests(1)}>Поиск</button>
      </div>

      {loading && <div>Загрузка...</div>}
      {error && <div>{error}</div>}

      <div className="table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('RequestNumber')}>
                Номер заявки {sortField === 'RequestNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('creation_date')}>
                Дата создания {sortField === 'creation_date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Товаровед</th>
              <th>Фотограф</th>
              <th>Ретушер</th>
              <th>Количество товаров</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests && requests.length > 0 ? (
              requests.map((request, index) => (
                <tr key={`${request.RequestNumber}-${index}`}>
                  <td onClick={() => openModal(request.RequestNumber)}>{request.RequestNumber}</td>
                  <td>{request.creation_date}</td>
                  <td>{request.stockman ? `${request.stockman.first_name} ${request.stockman.last_name}` : 'Не назначен'}</td>
                  <td>{request.photographer_first_name ? `${request.photographer_first_name} ${request.photographer_last_name}` : 'Не назначен'}</td>
                  <td>{request.retoucher_first_name ? `${request.retoucher_first_name} ${request.retoucher_last_name}` : 'Не назначен'}</td>
                  <td>{request.total_products}</td>
                  <td>{request.status ? request.status.name : 'Не назначен'}</td>
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

      {isModalOpen && (
        <RequestModalManager
          isOpen={isModalOpen}
          onClose={closeModal}
          requestNumber={selectedRequestNumber}
        />
      )}
    </div>
  );
};

export default ManagerRequests;

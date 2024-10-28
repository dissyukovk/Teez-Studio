import React, { useState, useEffect, useCallback } from 'react';
import requestService from '../services/requestService';
import RequestModalSRCheck from './RequestModalSRCheck';
import './RequestList.css';

const SRCheckRequests = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [sortField, setSortField] = useState('RequestNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функция для загрузки заявок по статусу
  const fetchRequests = useCallback(async () => {
    try {
      const response = await requestService.getRequests({
        status: 7, // Фильтрация по статусу 
        requestNumber: searchTerm,
        barcode: barcodeSearch,
        sortField: sortField,
        sortOrder: sortOrder,
        page: page,
        per_page: 10,
      });

      setRequests(response.results);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
    }
  }, [searchTerm, barcodeSearch, sortField, sortOrder, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleBarcodeSearch = (e) => {
    setBarcodeSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRequestClick = (requestNumber) => {
    setSelectedRequestNumber(requestNumber);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestNumber(null);
    fetchRequests(); // Обновляем список после закрытия модального окна
  };

  return (
    <div className="content">
      <h2>Распределение заявок для ретушера</h2>
      <input
        type="text"
        placeholder="Поиск по номеру заявки"
        value={searchTerm}
        onChange={handleSearch}
      />
      <input
        type="text"
        placeholder="Поиск по штрихкоду"
        value={barcodeSearch}
        onChange={handleBarcodeSearch}
      />
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => handleSort('RequestNumber')}>Номер заявки</th>
            <th onClick={() => handleSort('creation_date')}>Дата создания</th>
            <th>Ретушер</th>
            <th>Количество товаров</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.RequestNumber} onClick={() => handleRequestClick(request.RequestNumber)}>
              <td>{request.RequestNumber}</td>
              <td>{new Date(request.creation_date).toLocaleDateString()}</td>
              <td>
                {request.retoucher_first_name || request.retoucher_last_name
                  ? `${request.retoucher_first_name} ${request.retoucher_last_name}`
                  : 'Не назначен'}
              </td>
              <td>{request.total_products}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            style={{ margin: '0 5px' }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {isModalOpen && (
        <RequestModalSRCheck
          isOpen={isModalOpen}
          onClose={closeModal}
          requestNumber={selectedRequestNumber}
        />
      )}
    </div>
  );
};

export default SRCheckRequests;

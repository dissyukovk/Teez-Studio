import React, { useState, useEffect, useCallback } from 'react';
import requestService from '../services/requestService';
import './RequestList.css';
import RequestModalSPhDis from './RequestModalSPhDis';

const PhOnShootRequests = ({ status }) => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeTerm, setBarcodeTerm] = useState('');
  const [sortField, setSortField] = useState('RequestNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await requestService.getRequests({
        status,
        requestNumber: searchTerm || undefined,
        barcode: barcodeTerm || undefined,
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
  }, [status, searchTerm, barcodeTerm, sortField, sortOrder, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleBarcodeSearch = (e) => {
    setBarcodeTerm(e.target.value);
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
    fetchRequests();
  };

  return (
    <div className="request-list-container">
      <h2>Заявки со статусом {status}</h2>
      
      <input
        className="search-input"
        type="text"
        placeholder="Поиск по номеру заявки"
        value={searchTerm}
        onChange={handleSearch}
      />
      
      <input
        className="search-input"
        type="text"
        placeholder="Поиск по штрихкоду"
        value={barcodeTerm}
        onChange={handleBarcodeSearch}
      />

      <table className="request-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('RequestNumber')}>Номер заявки</th>
            <th onClick={() => handleSort('creation_date')}>Дата создания</th>
            <th>Фотограф</th>
            <th>Количество товаров</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.RequestNumber}>
              <td
                onClick={() => handleRequestClick(request.RequestNumber)}
                className="request-number-cell"
              >
                {request.RequestNumber}
              </td>
              <td>{new Date(request.creation_date).toLocaleDateString()}</td>
              <td>
                {request.photographer_first_name || request.photographer_last_name
                  ? `${request.photographer_first_name} ${request.photographer_last_name}`
                  : 'Не назначен'}
              </td>
              <td>{request.total_products}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-container">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`pagination-button ${page === i + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {isModalOpen && (
        <RequestModalSPhDis
          isOpen={isModalOpen}
          onClose={closeModal}
          requestNumber={selectedRequestNumber}
        />
      )}
    </div>
  );
};

export default PhOnShootRequests;

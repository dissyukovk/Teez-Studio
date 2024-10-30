import React, { useState, useEffect, useCallback } from 'react';
import requestService from '../services/requestService';
import RequestModalR from './RequestModalR';
import './RequestList.css'; // Подключите файл стилей для таблицы

const ReRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('RequestNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user || !user.id) {
      console.error('User ID not found');
      return;
    }
  
    try {
      const response = await requestService.getRequests({
        retoucher: user.id, // Передаем ID текущего пользователя как ретушера
        status: 6,          // Фильтрация по статусу, соответствующему "на ретуши"
        requestNumber: searchTerm || undefined,
        sortField,
        sortOrder,
        page,
        per_page: 10,
      });
      setRequests(response.results);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
    }
  }, [user, searchTerm, sortField, sortOrder, page]);
 

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  return (
    <div className="content">
      <h2>Заявки на ретушь</h2>
      <input
        type="text"
        placeholder="Поиск по номеру заявки"
        value={searchTerm}
        onChange={handleSearch}
      />
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => handleSort('RequestNumber')}>Номер заявки</th>
            <th onClick={() => handleSort('creation_date')}>Дата создания</th>
            <th>Ретушер</th>
            <th onClick={() => handleSort('total_products')}>Количество товаров</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.RequestNumber} onClick={() => handleRequestClick(request)}>
              <td>{request.RequestNumber}</td>
              <td>{new Date(request.creation_date).toLocaleDateString()}</td>
              <td>{request.retoucher_first_name} {request.retoucher_last_name || 'Не назначен'}</td>
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
            className={page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {isModalOpen && selectedRequest && (
        <RequestModalR
          isOpen={isModalOpen}
          onClose={closeModal}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

export default ReRequests;

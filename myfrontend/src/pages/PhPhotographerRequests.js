import React, { useState, useEffect, useCallback } from 'react';
import requestService from '../services/requestService';
import './RequestList.css'; // Стили для таблиц
import RequestModalPh from './RequestModalPh'; // Импорт нового модального окна

const PhPhotographerRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState(null); // Для открытия модального окна
  const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для открытия модального окна

  // Функция для загрузки заявок фотографа
  const fetchRequests = useCallback(async () => {
    if (!user || !user.id) {
      console.error('User ID not found');
      return;
    }
  
    try {
      const response = await requestService.getRequests({
        photographer: user.id,  // Фильтрация по ID фотографа
        status: 3,              // Фильтрация по статусу "на съемке"
        requestNumber: searchTerm || undefined,
        page: page,
        per_page: 10,
      });
      setRequests(response.results);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
    }
  }, [user, searchTerm, page]);
 

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Функция для открытия модального окна
  const handleRequestClick = (requestNumber) => {
    setSelectedRequestNumber(requestNumber);
    setIsModalOpen(true);
  };

  // Функция для закрытия модального окна и обновления списка
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestNumber(null);
    fetchRequests(); // Обновляем список после закрытия окна
  };

  return (
    <div className="content">
      <h2>Заявки на съемку</h2>
      <input
        type="text"
        placeholder="Поиск по номеру заявки"
        value={searchTerm}
        onChange={handleSearch}
      />
      <table className="request-table">
        <thead>
          <tr>
            <th>Номер заявки</th>
            <th>Дата создания</th>
            <th>Фотограф</th>
            <th>Количество товаров</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.RequestNumber}>
              <td
                onClick={() => handleRequestClick(request.RequestNumber)} // Открываем модальное окно по клику
                className="request-number-cell"
              >
                {request.RequestNumber}
              </td>
              <td>{new Date(request.creation_date).toLocaleDateString()}</td>
              <td>{`${request.photographer_first_name} ${request.photographer_last_name}`}</td>
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

      {/* Модальное окно */}
      {isModalOpen && (
        <RequestModalPh
          isOpen={isModalOpen}
          onClose={closeModal}
          requestNumber={selectedRequestNumber}
        />
      )}
    </div>
  );
};

export default PhPhotographerRequests;

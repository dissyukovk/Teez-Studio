import React, { useState, useEffect, useCallback } from 'react';
import requestService from '../services/requestService'; // Универсальная функция запросов
import './RequestList.css'; // Импортируем стили для таблиц и пагинации
import RequestModalSPhDis from './RequestModalSPhDis'; // Импорт модального окна

const PhDistributeRequests = ({ status }) => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeTerm, setBarcodeTerm] = useState(''); // Состояние для поиска по штрихкоду
  const [sortField, setSortField] = useState('RequestNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState(null); // Для открытия модального окна
  const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для открытия модального окна

  // Функция для загрузки заявок по статусу и штрихкоду
  const fetchRequests = useCallback(async () => {
    try {
      const response = await requestService.getRequests({
        status: 2, // Фильтрация по статусу
        requestNumber: searchTerm || undefined, // Поиск по номеру заявки
        barcode: barcodeTerm || undefined, // Поиск по штрихкоду
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
  }, [searchTerm, barcodeTerm, sortField, sortOrder, page]);

  useEffect(() => {
    fetchRequests(); // Вызываем функцию для загрузки данных
  }, [fetchRequests]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Сбрасываем на первую страницу при новом поиске
  };

  const handleBarcodeSearch = (e) => {
    setBarcodeTerm(e.target.value);
    setPage(1); // Сбрасываем на первую страницу при новом поиске
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Функция для открытия модального окна
  const handleRequestClick = (requestNumber) => {
    setSelectedRequestNumber(requestNumber); // Сохраняем выбранный номер заявки
    setIsModalOpen(true); // Открываем модальное окно
  };

  // Функция для закрытия модального окна и обновления списка
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestNumber(null); // Очищаем выбранный номер заявки при закрытии
    fetchRequests(); // Заново загружаем список заявок после закрытия модального окна
  };

  return (
    <div className="request-list-container">
      <h2>Заявки со статусом {status}</h2>
      
      {/* Поле поиска по номеру заявки */}
      <input
        className="search-input"
        type="text"
        placeholder="Поиск по номеру заявки"
        value={searchTerm}
        onChange={handleSearch}
      />
      
      {/* Поле поиска по штрихкоду */}
      <input
        className="search-input"
        type="text"
        placeholder="Поиск по штрихкоду"
        value={barcodeTerm}
        onChange={handleBarcodeSearch}
      />

      {/* Таблица заявок */}
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
                onClick={() => handleRequestClick(request.RequestNumber)} // Открываем модальное окно по клику
                className="request-number-cell"
              >
                {request.RequestNumber}
              </td>
              <td>{new Date(request.creation_date).toLocaleDateString()}</td>
              <td>{request.photographer_first_name || request.photographer_last_name
                  ? `${request.photographer_first_name} ${request.photographer_last_name}`
                  : 'Не назначен'}</td>
              <td>{request.total_products}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Пагинация */}
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
        <RequestModalSPhDis
          isOpen={isModalOpen}
          onClose={closeModal}
          requestNumber={selectedRequestNumber}
        />
      )}
    </div>
  );
};

export default PhDistributeRequests;

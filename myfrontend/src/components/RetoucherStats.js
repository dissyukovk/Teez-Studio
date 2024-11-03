import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import './PhotographerStats.css'; // Use the same CSS file

const RetoucherStats = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async (date) => {
    setLoading(true);
    try {
      const response = await requestService.getRetoucherStats(date);
      setStats(response);
    } catch (error) {
      console.error("Error fetching retoucher stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    if (date) {
      fetchStats(date);
    }
  };

  return (
    <div className="photographer-stats-container" style={{ marginLeft: '250px' }}>
      <h2>Статистика по ретушерам</h2>
      <label>
        Выберите дату:
        <input type="date" value={selectedDate} onChange={handleDateChange} />
      </label>

      {loading ? (
        <p>Загрузка данных...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ретушер</th>
              <th>Количество заявок</th>
              <th>Количество товаров</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.id}>
                <td>{stat.first_name} {stat.last_name}</td>
                <td>{stat.requests_count}</td>
                <td>{stat.total_products}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RetoucherStats;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerProductStats = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [stats, setStats] = useState(null);
  const [stockmen, setStockmen] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to get the authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    // Fetch stockman list on component mount
    axios
      .get('http://192.168.6.15:8000/api/stockman-list/', getAuthHeaders())
      .then(response => setStockmen(response.data))
      .catch(error => console.error('Error fetching stockman list:', error));
  }, []);

  const fetchStats = async (date) => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.6.15:8000/api/manager-product-stats/', {
        params: { date },
        ...getAuthHeaders(),
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    <div style={{ marginLeft: '250px' }}>
      <h2>Статистика по товарам (Менеджер)</h2>
      <label>
        Выберите дату:
        <input type="date" value={selectedDate} onChange={handleDateChange} />
      </label>

      {loading ? (
        <p>Загрузка данных...</p>
      ) : (
        stats && (
          <table>
            <thead>
              <tr>
                <th>Операция</th>
                {stockmen.map(stockman => (
                  <th key={stockman.id}>{stockman.first_name} {stockman.last_name}</th>
                ))}
                <th>ВСЕГО</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Заказано</td>
                <td colSpan={stockmen.length}></td>
                <td>{stats.ordered}</td>
              </tr>
              <tr>
                <td>Принято</td>
                {stockmen.map(stockman => (
                  <td key={stockman.id}>
                    {stats.accepted.find(a => a.user_id === stockman.id)?.total || 0}
                  </td>
                ))}
                <td>{stats.accepted.reduce((sum, a) => sum + a.total, 0)}</td>
              </tr>
              <tr>
                <td>Отправлено</td>
                {stockmen.map(stockman => (
                  <td key={stockman.id}>
                    {stats.shipped.find(s => s.user_id === stockman.id)?.total || 0}
                  </td>
                ))}
                <td>{stats.shipped.reduce((sum, s) => sum + s.total, 0)}</td>
              </tr>
              <tr>
                <td>БРАК</td>
                <td colSpan={stockmen.length}></td>
                <td>{stats.defective}</td>
              </tr>
              <tr>
                <td>Принято без заявок</td>
                <td colSpan={stockmen.length}></td>
                <td>{stats.accepted_without_request || 0}</td>
              </tr>
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default ManagerProductStats;

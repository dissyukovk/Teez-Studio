import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function HomePage({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.groups && user.groups.includes("OKЗ")) {
      // Если пользователь состоит в группе "OKЗ", перенаправляем на страницу okz_orders
      navigate('/okz_orders');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Don't render if no user
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar user={user} />
      <div style={{ marginLeft: '250px', padding: '20px' }}>
        <h1>Привет, {user.first_name} {user.last_name}!</h1>
        {/* Дополнительный контент */}
      </div>
    </div>
  );
}

export default HomePage;

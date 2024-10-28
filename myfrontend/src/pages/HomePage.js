import React from 'react';
import Sidebar from '../components/Sidebar'; // Убедитесь, что путь корректен

function HomePage({ user }) {
  if (!user) {
    return null; // Don't render if no user
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar слева */}
      <Sidebar user={user} />
      
      {/* Основное содержимое страницы */}
      <div style={{ marginLeft: '250px', padding: '20px' }}>
        <h1>Привет, {user.first_name} {user.last_name}!</h1>
        {/* Дополнительный контент */}
      </div>
    </div>
  );
}

export default HomePage;

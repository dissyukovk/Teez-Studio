import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';  // Используем NavLink вместо Link для активного состояния
import './Sidebar.css';

function Sidebar({ user }) {
  const [showLogout, setShowLogout] = useState(false); // Состояние для отображения кнопки выхода
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user || !user.groups) {
    return null; // If no user or groups, don't render the sidebar
  }

  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? 'Закрыть' : 'Меню'}
      </button>
      {/* TEEZ STUDIO Logo Link */}
      <NavLink to="/" className="teez-studio-link">
        TEEZ STUDIO
      </NavLink>
      {/* Links for user based on roles */}
      <ul>
        {/* Stockman (Товаровед) Section */}
        {user.groups.includes('Товаровед') && (
          <>
            <li>
              <NavLink to="/products" activeClassName="active">Товары (товаровед)</NavLink>
            </li>
            <li>
              <NavLink to="/requests" activeClassName="active">Заявки (товаровед)</NavLink>
            </li>
            <li>
              <NavLink to="/invoices" activeClassName="active">Накладные (товаровед)</NavLink>
            </li>
            <li>
              <NavLink to="/orders" activeClassName="active">Заказ (товаровед)</NavLink> {/* Новый пункт */}
            </li>
            <li>
              <NavLink to="/print-barcode" activeClassName="active">Печать ШК</NavLink>
            </li>
          </>
        )}
        {/* Super Admin (суперадминистратор) Section */}
        {user.groups.includes('Суперадминистратор') && (
            <>
              <li>
                <NavLink to="/admin-products" activeClassName="active">Полная БД товаров (суперадминистратор)</NavLink>
              </li>
              <li>
                <NavLink to="/create-order" activeClassName="active">Создание заказов (суперадмин)</NavLink>
              </li>
            </>
          )}
        {/* Старший фотограф Section */}
        {user.groups.includes('Старший фотограф') && (
          <>
            <li>
              <NavLink to="/requests/distribute" activeClassName="active">Распределить</NavLink>
            </li>
            <li>
              <NavLink to="/requests/check" activeClassName="active">Проверить</NavLink>
            </li>
            <li>
              <NavLink to="/requests/onshoot" activeClassName="active">На съемке</NavLink>
            </li>
          </>
        )}

        {/* Старший ретушер Section */}
        {user.groups.includes('Старший ретушер') && (
          <>
            <li>
              <NavLink to="/sr/requests/distribute" activeClassName="active">Распределить (ретушер)</NavLink>
            </li>
            <li>
              <NavLink to="/sr/requests/check" activeClassName="active">Проверить (ретушер)</NavLink>
            </li>
            <li>
              <NavLink to="/sr/requests/inretouch" activeClassName="active">В ретуши</NavLink>
            </li>
          </>
        )}

        {/* Фотограф Section */}
        {user.groups.includes('Фотограф') && (
          <>
            <li>
              <NavLink to="/requests/photographer" activeClassName="active">Заявки на съемку (фотограф)</NavLink>
            </li>
          </>
        )}
        {/* Ретушер Section */}
          {user.groups.includes('Ретушер') && (
            <>
              <li>
                <NavLink to="/requests/retoucher" activeClassName="active">Заявки на ретушь (ретушер)</NavLink>
              </li>
            </>
          )}
          {/* Warehouse Section */}
            {user.groups.includes('warehouse') && (
              <>
              <li>
                <NavLink to="/current-products-fs" activeClassName="active">
                  Текущие товары на фс
                </NavLink>
              </li>
              <li><NavLink to="/barcode-history">История по штрихкоду</NavLink></li>
              </>
              
            )}


      </ul>

      {/* User Info at the bottom */}
      <div className="user-info" onClick={() => setShowLogout(!showLogout)}>
        <div className="user-name">
          {user.first_name} {user.last_name}
        </div>
        {showLogout && (
          <div className="logout-button" onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login'; // Logout and redirect to login
          }}>
            Выйти
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;

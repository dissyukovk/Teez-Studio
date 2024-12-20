import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ user }) {
  const [showLogout, setShowLogout] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user || !user.groups) {
    return null; 
  }

  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? 'Закрыть' : 'Меню'}
      </button>
      <NavLink to="/" className="teez-studio-link">
        TEEZ STUDIO
      </NavLink>

      <ul>
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
              <NavLink to="/fs_list" activeClassName="active">Заказ (товаровед)</NavLink>
            </li>
            <li>
              <NavLink to="/print-barcode" activeClassName="active">Печать ШК</NavLink>
            </li>
            <li>
              <NavLink to="/fs_manager_requesthistory" activeClassName="active">История изменения заявок</NavLink>
            </li>
          </>
        )}

        {user.groups.includes('Суперадминистратор') && (
          <>
            <li>
              <NavLink to="/admin-products" activeClassName="active">Полная БД товаров (суперадминистратор)</NavLink>
            </li>
            <li>
              <NavLink to="/create-order" activeClassName="active">Создание заказов (суперадмин)</NavLink>
            </li>
            <li>
              <NavLink to="/categories" activeClassName="active">Категории</NavLink>
            </li>
          </>
        )}

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
            <li>
              <NavLink to="/photographer-stats" activeClassName="active">Статистика фотографов</NavLink>
            </li>
            <li>
              <NavLink to="/requests/manager" activeClassName="active">Заявки (общий лист)</NavLink>
            </li>
          </>
        )}

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
            <li>
              <NavLink to="/retoucher-stats" activeClassName="active">Статистика ретушеров</NavLink>
            </li>
            <li>
              <NavLink to="/requests/manager" activeClassName="active">Заявки (общий лист)</NavLink>
            </li>
          </>
        )}

        {user.groups.includes('Фотограф') && (
          <>
            <li>
              <NavLink to="/requests/photographer" activeClassName="active">Заявки на съемку (фотограф)</NavLink>
            </li>
          </>
        )}

        {user.groups.includes('Ретушер') && (
          <>
            <li>
              <NavLink to="/requests/retoucher" activeClassName="active">Заявки на ретушь (ретушер)</NavLink>
            </li>
          </>
        )}

        {user.groups.includes('warehouse') && (
          <>
            <li>
              <NavLink to="/current-products-fs" activeClassName="active">Текущие товары на фс</NavLink>
            </li>
            <li>
              <NavLink to="/barcode-history" activeClassName="active">История по штрихкоду</NavLink>
            </li>
          </>
        )}

        {user.groups.includes('Менеджер') && (
          <>
            <li>
              <NavLink to="/requests/manager" activeClassName="active">Заявки (менеджер)</NavLink>
            </li>
            <li>
              <NavLink to="/fs_manager_request_list" activeClassName="active">Заявки 2.0</NavLink>
            </li>
            <li>
              <NavLink to="/products-manager" activeClassName="active">Список товаров (менеджер)</NavLink>
            </li>
            <li>
              <NavLink to="/manager-product-stats" activeClassName="active">Статистика товароведов (менеджер)</NavLink>
            </li>
            <li>
              <NavLink to="/photographer-stats" activeClassName="active">Статистика фотографов</NavLink>
            </li>
            <li>
              <NavLink to="/retoucher-stats" activeClassName="active">Статистика ретушеров</NavLink>
            </li>
            <li>
              <NavLink to="/orders" activeClassName="active">Заказы</NavLink>
            </li>
            <li>
              <NavLink to="/create-order" activeClassName="active">Создание заказов</NavLink>
            </li>
            <li>
              <NavLink to="/invoices" activeClassName="active">Накладные (Отправка)</NavLink>
            </li>
            <li>
              <NavLink to="/fs_manager_requesthistory" activeClassName="active">История изменения заявок</NavLink>
            </li>
          </>
        )}

        {/* OKЗ Section */}
        {user.groups.includes('ОКЗ') && (
          <li>
            <NavLink to="/okz_list" activeClassName="active">Заказы ФС</NavLink>
          </li>
        )}
      </ul>
      <div className="user-info" onClick={() => setShowLogout(!showLogout)}>
        <div className="user-name">
          {user.first_name} {user.last_name}
        </div>
        {showLogout && (
          <div className="logout-button" onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}>
            Выйти
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;

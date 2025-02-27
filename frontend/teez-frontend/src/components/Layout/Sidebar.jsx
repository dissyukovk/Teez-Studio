import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Switch, Button, message, Typography } from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  DownOutlined,
  UserOutlined
} from '@ant-design/icons';
import axiosInstance from '../../utils/axiosInstance';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = ({ darkMode, setDarkMode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Загружаем данные пользователя, если есть токен
  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      axiosInstance
        .get('/ft/user-info/')
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error('Ошибка получения данных пользователя', err);
        });
    }
  }, []);

  const onCollapse = (collapsedVal) => {
    setCollapsed(collapsedVal);
  };

  const toggleTheme = (checked) => {
    setDarkMode(checked);
  };

  const handleLoginLogout = () => {
    if (user) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      message.success('Вы вышли из системы');
      window.location.href = '/login';
    } else {
      window.location.href = '/login';
    }
  };

  // Обновлённые пункты меню для раздела "Гость"
  const guestMenuItems = [
    {
      key: 'newreadyphotos2',
      label: <Link to="/ready-photos-2">Готовые фото 2.0</Link>,
    },
    {
      key: 'readyphotos',
      label: <Link to="/readyphotos">Готовые фото 1.0</Link>,
    },
    {
      key: 'nofoto',
      label: <Link to="/nofoto">Товары без фото</Link>,
    },
    { key: 'defect', label: <Link to="/defect">Браки</Link> },
    { key: 'barcode-history', label: <Link to="/barcode-history">История операций</Link> },
    { key: 'guest-6', label: 'Список товаров на ФС', disabled: true },
    { key: 'guest-7', label: 'Заказы ФС', disabled: true },
    { key: 'guest-8', label: 'Накладные ФС', disabled: true },
  ];

  const tovarovedMenuItems = [
    { key: 'tov-1', label: 'Приемка', disabled: true },
    { key: 'tov-2', label: 'Отправка', disabled: true },
    { key: 'tov-3', label: 'Заявки', disabled: true },
    { key: 'tov-4', label: 'Список товаров', disabled: true },
    { key: 'tov-5', label: 'Заказы', disabled: true },
    { key: 'tov-6', label: 'Накладные', disabled: true },
  ];

  const menuItems = [
    {
      key: 'main',
      icon: <UserOutlined />,
      label: <Link to="/">Главная</Link>,
    },
    {
      key: 'guestDropdown',
      icon: <DownOutlined />,
      label: 'Гость',
      children: guestMenuItems,
    },
  ];

  if (user && user.groups && user.groups.includes('Товаровед')) {
    menuItems.push({
      key: 'tovDropdown',
      icon: <DownOutlined />,
      label: 'Товаровед',
      children: tovarovedMenuItems,
    });
  }

  // Определяем, какой пункт меню активен
  let selectedKey = 'main';
  if (location.pathname.startsWith('/ready-photos-2')) {
    selectedKey = 'newreadyphotos2';
  }
  if (location.pathname.startsWith('/nofoto')) {
    selectedKey = 'nofoto';
  }
  if (location.pathname.startsWith('/defect')) {
    selectedKey = 'defect';
  }
  if (location.pathname.startsWith('/barcode-history')) {
    selectedKey = 'barcode-history';
  }
  else if (location.pathname.startsWith('/readyphotos')) {
    selectedKey = 'readyphotos';
  }

  const defaultOpenKeys = [];
  if (selectedKey === 'readyphotos' || selectedKey === 'newreadyphotos2' || selectedKey === 'nofoto' || selectedKey === 'defect' || selectedKey === 'barcode-history' ) {
    defaultOpenKeys.push('guestDropdown');
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={250}
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#001529' : '#fff',
      }}
    >
      {/* Логотип */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <Title level={collapsed ? 4 : 2} style={{ margin: 0, color: '#90ee90' }}>
          {collapsed ? 'T' : 'Teez Studio 3.0'}
        </Title>
      </div>

      {/* Переключатель темы */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Switch
          checked={darkMode}
          onChange={toggleTheme}
          checkedChildren="Dark"
          unCheckedChildren="Light"
        />
      </div>

      {/* Меню */}
      <Menu
        selectedKeys={[selectedKey]}
        defaultOpenKeys={defaultOpenKeys}
        mode="inline"
        theme={darkMode ? 'dark' : 'light'}
        inlineCollapsed={collapsed}
        items={menuItems}
      />

      {/* Нижняя часть: пользователь и кнопка Войти/Выход */}
      <div style={{ padding: 16 }}>
        {user ? (
          <>
            {!collapsed && (
              <div style={{ marginBottom: 8, color: darkMode ? '#fff' : '#000' }}>
                {user.first_name} {user.last_name}
              </div>
            )}
            <Button
              type="primary"
              danger
              block
              onClick={handleLoginLogout}
              icon={<LogoutOutlined />}
            >
              {!collapsed && 'Выход'}
            </Button>
          </>
        ) : (
          <Button
            type="primary"
            block
            onClick={handleLoginLogout}
            icon={<LoginOutlined />}
          >
            {!collapsed && 'Войти'}
          </Button>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;

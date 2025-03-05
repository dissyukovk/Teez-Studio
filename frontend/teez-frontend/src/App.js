// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import Home from './pages/Home';
import Login from './pages/Login';
import ReadyPhotos2 from './pages/guest/ReadyPhotos2';
import ReadyPhotos from './pages/guest/ReadyPhotos';
import NofotoPage from './pages/guest/nofoto';
import DefectOperationsPage from './pages/guest/DefectOperationsPage';
import ProductOperationsPage from './pages/guest/ProductOperationsPage';
import PublicOrdersPage from './pages/guest/PublicOrders';
import PublicOrderDetailPage from './pages/guest/PublicOrderDetail';
import StockmanOrders from './pages/stockman/stockmanorders';
import StockmanOrderDetailPage from './pages/stockman/stockmanorderdetail';

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('appTheme') === 'dark'
  );

  useEffect(() => {
    localStorage.setItem('appTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const algorithm = darkMode
    ? antdTheme.darkAlgorithm
    : antdTheme.defaultAlgorithm;

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          // Меняем глобальный шрифт
          fontFamily: 'Arial, sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Главная */}
          <Route
            path="/"
            element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          {/* Страница "Готовые фото 2.0" */}
          <Route
            path="/ready-photos-2"
            element={<ReadyPhotos2 darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          {/* Страница "Готовые фото 1.0" */}
          <Route
            path="/readyphotos"
            element={<ReadyPhotos darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          {/* Страница "Без фото" */}
          <Route
            path="/nofoto"
            element={<NofotoPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          {/* Страница "Браки" */}
          <Route
            path="/defect"
            element={<DefectOperationsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          {/* Страница "История по штрихкоду" */}
          <Route
            path="/barcode-history"
            element={<ProductOperationsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route
            path="/public-orders"
            element={<PublicOrdersPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route
            path="/public-order-detail/:order_number"
            element={<PublicOrderDetailPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route
            path="/stockman-orders"
            element={<StockmanOrders darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route
            path="/stockman-order-detail/:order_number"
            element={<StockmanOrderDetailPage darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
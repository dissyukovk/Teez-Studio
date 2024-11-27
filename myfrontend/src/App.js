import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import 'antd/dist/reset.css';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import ProductTable from './components/ProductTable';
import ProductListManager from './components/ProductListManager';
import Requests from './components/Requests';
import Invoices from './components/Invoices';
import AdminProducts from './components/AdminProducts';
import authService from './services/authService';
import Sidebar from './components/Sidebar';
import PhPhotographerRequests from './pages/PhPhotographerRequests';
import SRDistributeRequests from './pages/SRDistributeRequests';
import SRCheckRequests from './pages/SRCheckRequests';
import SRInRetouchRequests from './pages/SRInRetouchRequests';
import ReRequests from './pages/ReRequests';
import OrderTable from './components/OrderTable';
import OrderView from './pages/OrderView';
import InvoiceView from './pages/InvoiceView';
import CreateOrder from './components/CreateOrder';
import PrintBarcode from './components/PrintBarcode';
import CurrentProductsFS from './components/CurrentProductsFS';
import BarcodeHistory from './components/BarcodeHistory';
import ManagerRequests from './components/ManagerRequests';
import CategoryTable from './components/CategoryTable';
import DefectOperations from './components/DefectOperations';
import PhotographerStats from './components/PhotographerStats';
import RetoucherStats from './components/RetoucherStats';
import ManagerProductStats from './components/ManagerProductStats';
import ReadyPhotos from './components/ReadyPhotos';
import PhDistributeRequests from './pages/PhDistributeRequests';
import PhCheckRequests from './pages/PhCheckRequests';
import PhOnShootRequests from './pages/PhOnShootRequests';
import AutoUploadTest from './pages/AutoUploadTest';
import OkzOrderTable from './components/okz_OrderTable';
import OkzOrderView from './pages/okz_OrderView';
import FsOrderTable from './components/fs_OrderTable';
import FsOrderView from './pages/fs_OrderView';
import FSStockmanRequestView from './pages/FS_Stockman_RequestView';
import FsManagerRequestHistory from './pages/fs_manager_requesthistory';

const AppContent = ({ isAuthenticated, user }) => {
  const location = useLocation();

  // Проверка на перенаправление для пользователей группы "OKЗ"
  if (isAuthenticated && user?.groups?.includes("OKЗ") && location.pathname === "/") {
    return <Navigate to="/okz_orders" />;
  }

  // Определяем маршруты, где не нужно отображать боковую панель
  const noSidebarRoutes = ['/defect', '/ready-photos', '/current-products-fs', '/barcode-history', '/okz_orders', '/okz_orders/:orderNumber'];

  // Функция для проверки, нужен ли сайдбар на текущем пути
  const shouldShowSidebar = () => {
    return isAuthenticated && !noSidebarRoutes.some(route => {
      const regex = new RegExp(`^${route.replace(':orderNumber', '[^/]+')}$`);
      return regex.test(location.pathname);
    });
  };

  return (
    <div className="app">
      {shouldShowSidebar() && <Sidebar user={user} />}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={isAuthenticated ? <HomePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/products" element={isAuthenticated ? <ProductTable /> : <Navigate to="/login" />} />
        <Route path="/requests" element={isAuthenticated ? <Requests /> : <Navigate to="/login" />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:invoiceNumber" element={<InvoiceView />} />
        <Route path="/admin-products" element={isAuthenticated ? <AdminProducts /> : <Navigate to="/login" />} />
        <Route path="/orders" element={isAuthenticated ? <OrderTable /> : <Navigate to="/login" />} />
        <Route path="/order_view/:orderNumber" element={isAuthenticated ? <OrderView /> : <Navigate to="/login" />} />
        <Route path="/create-order" element={<CreateOrder />} />
        <Route path="/requests/distribute" element={isAuthenticated ? <PhDistributeRequests /> : <Navigate to="/login" />} />
        <Route path="/products-manager" element={isAuthenticated ? <ProductListManager /> : <Navigate to="/login" />} />
        <Route path="/requests/check" element={isAuthenticated ? <PhCheckRequests /> : <Navigate to="/login" />} />
        <Route path="/requests/onshoot" element={isAuthenticated ? <PhOnShootRequests /> : <Navigate to="/login" />} />
        <Route path="/requests/photographer" element={isAuthenticated ? <PhPhotographerRequests user={user} /> : <Navigate to="/login" />} />
        <Route path="/sr/requests/distribute" element={isAuthenticated ? <SRDistributeRequests user={user} /> : <Navigate to="/login" />} />
        <Route path="/sr/requests/check" element={isAuthenticated ? <SRCheckRequests user={user} /> : <Navigate to="/login" />} />
        <Route path="/sr/requests/inretouch" element={isAuthenticated ? <SRInRetouchRequests user={user} /> : <Navigate to="/login" />} />
        <Route path="/requests/retoucher" element={isAuthenticated ? <ReRequests user={user} /> : <Navigate to="/login" />} />
        <Route path="/print-barcode" element={isAuthenticated ? <PrintBarcode /> : <Navigate to="/login" />} />
        <Route path="/current-products-fs" element={<CurrentProductsFS />} />
        <Route path="/barcode-history" element={<BarcodeHistory />} />
        <Route path="/requests/manager" element={isAuthenticated ? <ManagerRequests /> : <Navigate to="/login" />} />
        <Route path="/categories" element={<CategoryTable />} />
        <Route path="/defect" element={<DefectOperations />} />
        <Route path="/photographer-stats" element={<PhotographerStats />} />
        <Route path="/retoucher-stats" element={isAuthenticated ? <RetoucherStats /> : <Navigate to="/login" />} />
        <Route path="/manager-product-stats" element={<ManagerProductStats />} />
        <Route path="/ready-photos" element={<ReadyPhotos />} />
        <Route path="/upload-test" element={<AutoUploadTest />} />
        <Route path="/okz_list" element={isAuthenticated ? <OkzOrderTable /> : <Navigate to="/login" />} />
        <Route path="/okz_orders/:orderNumber" element={isAuthenticated ? <OkzOrderView /> : <Navigate to="/login" />} />
        <Route path="/fs_list" element={isAuthenticated ? <FsOrderTable /> : <Navigate to="/login" />} />
        <Route path="/fs_orders/:orderNumber" element={isAuthenticated ? <FsOrderView /> : <Navigate to="/login" />} />
        <Route path="/fs_stockman_requestview/:requestNumber" element={isAuthenticated ? <FSStockmanRequestView /> : <Navigate to="/login" />} />
        <Route path="/fs_manager_requesthistory" element={isAuthenticated ? <FsManagerRequestHistory /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );  
};


const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getUserData();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <AppContent isAuthenticated={isAuthenticated} user={user} />
    </Router>
  );
};

export default App;

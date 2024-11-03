import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import ProductTable from './components/ProductTable'; // Replace StockmanProducts with ProductTable
import ProductListManager from './components/ProductListManager';
import Requests from './components/Requests';
import Invoices from './components/Invoices';
import AdminProducts from './components/AdminProducts'; // Import the new admin products page
import authService from './services/authService';
import Sidebar from './components/Sidebar';
import PhPhotographerRequests from './pages/PhPhotographerRequests';
import SRDistributeRequests from './pages/SRDistributeRequests';
import SRCheckRequests from './pages/SRCheckRequests';
import SRInRetouchRequests from './pages/SRInRetouchRequests';
import ReRequests from './pages/ReRequests';
import OrderTable from './components/OrderTable';
import OrderView from './pages/OrderView';
import InvoiceView from './pages/InvoiceView'
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

// Import components for Senior Photographer
import PhDistributeRequests from './pages/PhDistributeRequests';
import PhCheckRequests from './pages/PhCheckRequests';
import PhOnShootRequests from './pages/PhOnShootRequests';

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
      <div className="app">
      {isAuthenticated && !window.location.pathname.includes('/defect') && <Sidebar user={user} />}
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route
            path="/"
            element={isAuthenticated ? <HomePage user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/products"
            element={isAuthenticated ? <ProductTable /> : <Navigate to="/login" />} // Use ProductTable instead of StockmanProducts
          />
          <Route
            path="/requests"
            element={isAuthenticated ? <Requests /> : <Navigate to="/login" />}
          />
          <Route
            path="/invoices"
            element={isAuthenticated ? <Invoices /> : <Navigate to="/login" />}
          />
          <Route path="/invoices/:invoiceNumber" element={<InvoiceView />} />
          <Route
            path="/admin-products" // Add route for the admin's full product database
            element={isAuthenticated ? <AdminProducts /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={isAuthenticated ? <OrderTable /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders/:orderNumber"
            element={isAuthenticated ? <OrderView /> : <Navigate to="/login" />}
          />
          <Route path="/create-order" element={<CreateOrder />} />
          {/* Routes for Senior Photographer */}
          <Route
            path="/requests/distribute"
            element={isAuthenticated ? <PhDistributeRequests /> : <Navigate to="/login" />}
          />
          <Route path="/products-manager" element={isAuthenticated ? <ProductListManager /> : <Navigate to="/login" />} />
          <Route
            path="/requests/check"
            element={isAuthenticated ? <PhCheckRequests /> : <Navigate to="/login" />}
          />
          <Route
            path="/requests/onshoot"
            element={isAuthenticated ? <PhOnShootRequests /> : <Navigate to="/login" />}
          />
           <Route
            path="/requests/photographer"
            element={isAuthenticated ? <PhPhotographerRequests user={user} /> : <Navigate to="/login" />}
          />
          {/* Routes for Senior Retoucher */}
          <Route
            path="/sr/requests/distribute"
            element={isAuthenticated ? <SRDistributeRequests user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/sr/requests/check"
            element={isAuthenticated ? <SRCheckRequests user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/sr/requests/inretouch"
            element={isAuthenticated ? <SRInRetouchRequests user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/requests/retoucher"
            element={isAuthenticated ? <ReRequests user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/print-barcode"
            element={isAuthenticated ? <PrintBarcode /> : <Navigate to="/login" />}
          />
          <Route
            path="/current-products-fs"
            element={isAuthenticated ? <CurrentProductsFS /> : <Navigate to="/login" />}
          />
          <Route
            path="/barcode-history"
            element={isAuthenticated ? <BarcodeHistory /> : <Navigate to="/login" />}
          />
          <Route
            path="/requests/manager"
            element={isAuthenticated ? <ManagerRequests /> : <Navigate to="/login" />}
          />
          <Route path="/categories" element={<CategoryTable />} />
          <Route path="/defect" element={<DefectOperations />} />
          <Route path="/photographer-stats" element={<PhotographerStats />} />
          <Route
            path="/retoucher-stats"
            element={isAuthenticated ? <RetoucherStats /> : <Navigate to="/login" />}
          />
          <Route path="/manager-product-stats" element={<ManagerProductStats />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

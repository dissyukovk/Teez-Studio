import axios from 'axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


const API_URL = 'http://192.168.6.162:8000/';

const getOrderStatuses = async () => {
  try {
    const response = await axios.get(`${API_URL}api/order-statuses/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching order statuses:', error);
    throw error;
  }
};

const getOrders = async (searchOrderNumber = '', searchBarcode = '', selectedStatus = '', sortField = '', sortOrder = 'asc', page = 1) => {
  try {
    const params = {
      OrderNumber: searchOrderNumber,
      barcode: searchBarcode,
      status: selectedStatus,
      sort_field: sortField,
      sort_order: sortOrder,
      page: page
    };
    const response = await axios.get(`${API_URL}order-list/`, { params, headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

const updateOrderStatus = async (orderNumber, statusId) => {
  const response = await axios.patch(`${API_URL}/orders/${orderNumber}/update-status/`, {
    status_id: statusId,
  });
  return response.data;
};

const getOrderDetails = async (orderNumber) => {
  try {
    const response = await axios.get(`${API_URL}orders/${orderNumber}/details/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Функция для создания нового заказа
const createOrder = async (barcodes) => {
  try {
    const response = await axios.post(`${API_URL}api/orders/create/`, { barcodes }, {
      headers: getAuthHeaders(),  // Добавляем заголовок с токеном
    });
    return response.data;  // Предполагаем, что API возвращает информацию о новом заказе
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    throw error;
  }
};

// Function to start assembly
const startAssembly = async (orderNumber, data) => {
  try {
    const response = await axios.post(`${API_URL}assembly-start/${orderNumber}/`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error starting assembly:', error);
    throw error;
  }
};

const assembleProduct = async (orderNumber, barcode) => {
  try {
    const response = await axios.post(`${API_URL}assembly/${orderNumber}/${barcode}/`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error assembling product:', error);
    throw error;
  }
};

// Start acceptance process
const startAcceptance = async (orderNumber, userId) => {
  try {
    const response = await axios.post(
      `${API_URL}accept-start/${orderNumber}/`,
      { user_id: userId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при начале приемки:', error);
    throw error;
  }
};

// Accept products in the order
const acceptProducts = async (orderNumber, barcodes) => {
  try {
    const response = await axios.post(
      `${API_URL}accept-order/${orderNumber}/`,
      { barcodes },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при приемке товаров:', error);
    throw error;
  }
};

const checkOrderStatus = async (orderNumber) => {
  try {
    const response = await axios.get(`${API_URL}orders/check/${orderNumber}/`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при проверке статуса заказа:', error);
    throw error;
  }
};

const orderService = {
  getOrderStatuses,
  getOrders,
  updateOrderStatus,
  getOrderDetails,
  createOrder,
  startAssembly,
  assembleProduct,
  startAcceptance,
  acceptProducts,
  checkOrderStatus
};

export default orderService;

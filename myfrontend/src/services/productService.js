import axios from 'axios';

const API_URL = 'http://192.168.1.15:8000/';  // Убедитесь, что это правильный URL

// Получаем токен из localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Function to get products with optional search and filter parameters
const getProducts = async (searchTerm = '', searchBarcode = '', sortField = '', sortOrder = 'asc', page = 1, per_page = 100) => {
  try {
    const response = await axios.get(`${API_URL}api/products/`, {
      headers: getAuthHeaders(),
      params: {
        name: searchTerm,         // Поиск по наименованию продукта
        barcode: searchBarcode,   // Поиск по штрихкоду
        sort_field: sortField,    // Поле для сортировки
        sort_order: sortOrder,    // Порядок сортировки
        page: page,               // Номер страницы
        per_page: per_page,       // Количество элементов на странице
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;  // Ошибки будут обработаны
  }
};

// Функция для получения конкретного продукта по штрихкоду
const getProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}api/products/${barcode}/`, {
      headers: getAuthHeaders(),  // Передаем токен авторизации
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении продукта по штрихкоду:', error);
    throw error;
  }
};


// Function to check if the barcode exists
const checkBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}api/check-barcode/${barcode}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;  // Возвращаем ответ с сервера
  } catch (error) {
    console.error('Error checking barcode:', error);
    throw error;
  }
};

const checkBarcodes = async (barcodes) => {
  try {
    const response = await axios.post(`${API_URL}api/check-barcodes/`, { barcodes }, {
      headers: getAuthHeaders(), // Добавляем заголовок с токеном
    });
    return response.data.missing_barcodes;  // массив отсутствующих штрихкодов
  } catch (error) {
    console.error('Ошибка при проверке штрихкодов:', error);
    throw error;
  }
};


// Function to get order information for a barcode
const getOrderForBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}api/get-order/${barcode}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;  // Возвращаем данные о заказе
  } catch (error) {
    console.error('Error fetching order for barcode:', error);
    throw error;
  }
};

// Универсальная функция для изменения статуса продуктов
const updateProductStatuses = async (barcodes, status) => {
  try {
    const response = await axios.post(`${API_URL}update-product-statuses/`, {
      barcodes: barcodes,
      status: status,
    }, {
      headers: getAuthHeaders(),
    });

    return response.data; // Возвращаем ответ без логирования операции
  } catch (error) {
    console.error(`Ошибка при обновлении статуса продуктов:`, error);
    throw error;
  }
};

// Функция для логирования операции брака
const logDefectOperation = async (barcode, userId, comment) => {
  try {
    const response = await axios.post(`${API_URL}api/log-defect/`, {
      barcode: barcode,
      userId: userId,
      comment: comment
    }, {
      headers: getAuthHeaders(),  // Добавляем заголовки для авторизации
    });

    return response.data;
  } catch (error) {
    console.error('Ошибка при логировании брака:', error);
    throw error;
  }
};

// Функция для логирования операции с продуктами
const addOperationToHistory = async (barcodes, operationType, comment) => {
  try {
    await axios.post(`${API_URL}product-operations/`, {
      barcodes: barcodes,
      operation: operationType,
      comment: comment  // Передаем комментарий
    }, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Ошибка при добавлении операции в историю:', error);
    throw error;
  }
};

// **Новая функция для получения последней активной заявки по штрихкоду**
const getLastRequestForBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}get-last-request/${barcode}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching last request for barcode:', error);
    throw error;
  }
};

const updateProductStatusIncome = async (barcodes, userId, status) => {
  try {
    const response = await axios.post(`${API_URL}api/accept-products/`, {
      barcodes,
      userId,
      status,
      date: new Date().toISOString()  // Текущая дата
    }, {
      headers: getAuthHeaders(),  // Добавляем токен авторизации
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при приемке товаров:', error);
    throw error;
  }
};

const updateProductStatusOutcome = async (barcodes, userId, status) => {
  try {
    const response = await axios.post(`${API_URL}api/send-products/`, {
      barcodes,
      userId,
      status,
      date: new Date().toISOString()  // Текущая дата
    }, {
      headers: getAuthHeaders(),  // Добавляем токен авторизации
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при отправке товаров:', error);
    throw error;
  }
};

const createRequest = async (barcodes, userId) => {
  try {
    const response = await axios.post(`${API_URL}api/create-request/`, {
      barcodes, 
      userId
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    throw error;
  }
};


// Остальные функции...

// Экспортируем все функции
const productService = {
  getProducts,
  checkBarcode,
  getLastRequestForBarcode,  // Добавляем новую функцию сюда
  updateProductStatuses,
  addOperationToHistory,
  getOrderForBarcode,
  updateProductStatusIncome,
  updateProductStatusOutcome,
  createRequest,
  getProductByBarcode,
  logDefectOperation,
  checkBarcodes
  // Остальные экспортируемые функции...
};

export default productService;

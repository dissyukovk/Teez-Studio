import axios from 'axios';

const API_URL = 'http://192.168.6.247:8000/';  // Убедитесь, что это правильный URL

// Получаем токен из localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Function to get products with optional search and filter parameters
// Function to get products with optional search and filter parameters
const getProducts = async (
  searchTerm = '',
  searchBarcode = '',
  sortField = '',
  sortOrder = 'asc',
  page = 1,
  per_page = 100,
  moveStatusIds = [] // Array of status IDs for filtering
) => {
  try {
    // Filter out any invalid entries from moveStatusIds (like empty strings)
    const validMoveStatusIds = moveStatusIds.filter(id => id);

    const response = await axios.get(`${API_URL}api/products/`, {
      headers: getAuthHeaders(),
      params: {
        name: searchTerm,
        barcode: searchBarcode,
        sort_field: sortField,
        sort_order: sortOrder,
        page: page,
        per_page: per_page,
        ...(moveStatusIds.length > 0 && { move_status_id__in: moveStatusIds })
      },
      paramsSerializer: params => {
        return Object.keys(params)
          .map(key => {
            if (Array.isArray(params[key])) {
              return params[key]
                .map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
                .join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
          })
          .join('&');
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
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
      
      if (response.status === 200) {
          return response.data;
      } else {
          throw new Error('Не удалось обновить статус товаров.');
      }
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

// В productService.js
const getProductsWithStatuses = async (statuses, name, barcode, sortField, sortOrder, page) => {
  const response = await axios.get(`${API_URL}api/products/`, {
    params: {
      statuses: statuses.join(','),
      name,
      barcode,
      sortField,
      sortOrder,
      page,
    },
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Function to fetch product operation history by barcode
const getProductHistoryByBarcode = async (barcode, page = 1, sortField = 'date', sortOrder = 'desc') => {
  try {
    const response = await axios.get(`${API_URL}api/product-history/${barcode}/`, {
      headers: getAuthHeaders(),
      params: {
        page,
        sort_field: sortField,
        sort_order: sortOrder,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении истории по штрихкоду:', error);
    throw error;
  }
};

// Функция для получения статусов товародвижения
const getMoveStatuses = async () => {
  try {
    const response = await axios.get(`${API_URL}api/move-statuses/`, {
      headers: getAuthHeaders(),
    });
    return response.data; // Вернем список статусов движения товаров
  } catch (error) {
    console.error('Ошибка при получении статусов движения:', error);
    throw error;
  }
};

// Функция для получения списка товароведов
const getStockman = async () => {
  try {
    const response = await axios.get(`${API_URL}api/stockman/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке товароведов:', error);
    throw error;
  }
};

// Функция для получения списка фотографов
const getPhotographers = async () => {
  try {
    const response = await axios.get(`${API_URL}api/photographers/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке фотографов:', error);
    throw error;
  }
};

// Функция для получения списка ретушеров
const getRetouchers = async () => {
  try {
    const response = await axios.get(`${API_URL}api/retouchers/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке ретушеров:', error);
    throw error;
  }
};

const markAsOpened = async (barcode, userId) => {
  try {
    const response = await axios.post(`${API_URL}api/mark-as-opened/`, {
      barcode,
      userId
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при пометке товара как вскрыто:', error);
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
  checkBarcodes,
  getProductsWithStatuses,
  getProductHistoryByBarcode,
  getMoveStatuses,
  getStockman,
  getPhotographers,
  getRetouchers,
  markAsOpened
  // Остальные экспортируемые функции...
};

export default productService;

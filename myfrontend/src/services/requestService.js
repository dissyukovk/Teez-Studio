import axios from 'axios';

// Получаем токен из localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const API_URL = 'http://192.168.1.15:8000/';  // Убедитесь, что URL правильный

const getRequests = async ({
  status = '', 
  requestNumber = '',
  barcode = '',
  sortField = '',
  sortOrder = 'asc',
  page = 1,
  per_page = 100,
}) => {
  try {
    const params = {
      status,
      RequestNumber: requestNumber || undefined,   // Убедимся, что RequestNumber используется
      barcode: barcode || undefined,             // Убедимся, что barcode используется
      sort_field: sortField,
      sort_order: sortOrder,
      page: page,
      per_page: per_page
    };

    const response = await axios.get(`${API_URL}api/strequests-list/filter/`, { params });
    console.log('Response from getRequests:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

const createRequest = async (requestNumber, barcodes) => {
  try {
    const response = await axios.post(`${API_URL}api/create-request/`, {
      requestNumber,
      barcodes,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data; // Вернем данные о заявке
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    throw error;
  }
};

const createDraftRequest = async () => {
  try {
    const response = await axios.post(`${API_URL}api/create-draft-request/`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data; // Возвращаем номер заявки
  } catch (error) {
    console.error('Ошибка при создании черновика заявки:', error);
    throw error;
  }
};

const finalizeRequest = async (requestNumber, barcodes) => {
  try {
    const response = await axios.post(`${API_URL}api/finalize-request/`, {
      requestNumber,
      barcodes,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при завершении заявки:', error);
    throw error;
  }
};

// Обновление статуса заявки и сохранение ссылки
const updateRequestStatus = async (requestNumber, status, photosLink) => {
  try {
    const response = await axios.post(
      `${API_URL}requests/${requestNumber}/update-status/`,
      { status, photos_link: photosLink || undefined }, // Передаем photos_link только если он задан
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

// Получение деталей заявки по номеру
const getRequestDetails = async (requestNumber) => {
  try {
    const response = await axios.get(`${API_URL}requests/${requestNumber}/details/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching request details:', error);
    throw error;
  }
};

// Получение информации о штрихкоде
const getBarcodeDetails = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}barcode/${barcode}/details/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching barcode details:', error);
    throw error;
  }
};

// Обновление заявки с новыми и удаленными штрихкодами
const updateRequest = async (requestNumber, addedBarcodes = [], removedBarcodes = []) => {
  try {
    console.log('Отправка данных на сервер:', {
      requestNumber,
      addedBarcodes,
      removedBarcodes
    }); // Добавляем лог перед отправкой
    const response = await axios.post(`${API_URL}requests/${requestNumber}/update/`, {
      addedBarcodes,
      removedBarcodes
    }, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

// Назначение фотографа и смена статуса заявки
const assignPhotographer = async (requestNumber, photographerId, comment) => {
  try {
    const response = await axios.post(
      `${API_URL}requests/${requestNumber}/assign-photographer/`,
      {
        photographer_id: photographerId,
        comment: comment, // Отправляем комментарий на сервер
      },
      { headers: getAuthHeaders() }
    );
    console.log('Photographer assigned:', response.data);
  } catch (error) {
    console.error('Error assigning photographer:', error);
  }
};

const getPhotographers = async () => {
  try {
    const response = await axios.get(`${API_URL}api/photographers/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching photographers:', error);
    throw error;
  }
};

// Получение списка ретушеров
const getRetouchers = async () => {
  try {
    const response = await axios.get(`${API_URL}api/retouchers/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching retouchers:', error);
    throw error;
  }
};

// Назначение ретушера на заявку
const assignRetoucher = async (requestNumber, retoucherId, comment) => {
  try {
    const data = { retoucher_id: retoucherId };
    if (comment) {
      data.sr_comment = comment;  // Добавляем комментарий, если он не пустой
    }
    const response = await axios.post(
      `${API_URL}api/requests/${requestNumber}/assign-retoucher/`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning retoucher:', error);
    throw error;
  }
};

const getRetouchStatuses = async () => {
  try {
    const response = await axios.get(`${API_URL}api/retouch-statuses/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статусов ретуши:', error);
    throw error;
  }
};

const updateRetouchStatusesAndLinks = async (requestNumber, barcodes) => {
  try {
    const response = await axios.post(
      `${API_URL}requests/${requestNumber}/update-retouch-statuses/`,
      { barcodes },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении статусов и ссылок ретуши:', error);
    throw error;
  }
};

// Добавляем функцию для получения списка статусов
const getRequestStatuses = async () => {
  try {
    const response = await axios.get(`${API_URL}api/request-statuses/`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статусов заявок:', error);
    throw error;
  }
};

const requestService = {
  getRequests,
  createRequest,
  createDraftRequest,
  finalizeRequest,
  getRequestDetails,
  getBarcodeDetails,
  updateRequest,
  assignPhotographer, 
  getPhotographers,
  updateRequestStatus,
  getRetouchers,
  assignRetoucher,
  getRetouchStatuses,
  updateRetouchStatusesAndLinks,
  getRequestStatuses
};

export default requestService;

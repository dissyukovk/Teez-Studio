import axios from 'axios';

const API_URL = 'http://192.168.6.49:8000/';

const getInvoices = async (invoiceNumber = '', barcode = '', sortField = '', sortOrder = 'asc', page = 1, per_page = 100) => {
  try {
    const response = await axios.get(`${API_URL}api/invoices-list/filter/`, {
      params: {
        invoice_number: invoiceNumber,
        barcode: barcode,
        sort_field: sortField,
        sort_order: sortOrder,
        page: page,
        per_page: per_page,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении накладных:', error);
    throw error;
  }
};

// Функция для создания новой накладной с токеном
const createInvoice = async (barcodes, userId) => {
  try {
    const token = localStorage.getItem('token');  // Предполагаем, что токен хранится в localStorage
    const response = await axios.post(`${API_URL}api/invoices/create/`, {
      barcodes: barcodes,
      date: new Date().toISOString(),
      creator: userId,  // Передаем ID текущего пользователя
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,  // Добавляем заголовок с токеном
        'Content-Type': 'application/json'
      }
    });
    return response.data.invoiceNumber;  // Возвращаем номер накладной
  } catch (error) {
    console.error('Ошибка при создании накладной:', error);
    throw error;
  }
};

const getInvoiceDetails = async (invoiceNumber) => {
  try {
    const response = await axios.get(`${API_URL}api/invoices/${invoiceNumber}/details/`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении деталей накладной:', error);
    throw error;
  }
};

const invoiceService = {
  getInvoices,
  createInvoice,
  getInvoiceDetails
};

export default invoiceService;

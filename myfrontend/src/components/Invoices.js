import React, { useEffect, useState, useCallback } from 'react';
import invoiceService from '../services/invoiceService';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({});
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');

  const openInvoiceDetails = (invoiceNumber) => {
    window.open(`/invoices/${invoiceNumber}`, '_blank');
  };
  
  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      const data = await invoiceService.getInvoices(searchInvoiceNumber, searchBarcode, '', 'asc', page);
      setInvoices(data.results);
      setPaginationInfo({
        next: data.next,
        previous: data.previous,
        totalPages: Math.ceil(data.count / 100),
      });
    } catch (error) {
      console.error('Ошибка при получении накладных:', error);
    }
  }, [searchInvoiceNumber, searchBarcode]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  // Обработчик для смены страницы
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="main-content">
      <h1>Накладные товароведа</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по номеру накладной"
          value={searchInvoiceNumber}
          onChange={(e) => setSearchInvoiceNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Поиск по штрихкоду"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
        />
        <button onClick={() => fetchInvoices(1)}>Поиск</button>
      </div>
      <div className="table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Номер накладной</th>
              <th>Дата</th>
              <th>Товаровед</th>
              <th>Количество товаров</th>
            </tr>
          </thead>
          <tbody>
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <tr key={invoice.InvoiceNumber || index}>
                  <td onClick={() => openInvoiceDetails(invoice.InvoiceNumber)} style={{ cursor: 'pointer', color: 'blue' }}>
                    {invoice.InvoiceNumber}
                  </td>
                  <td>{invoice.date}</td>
                  <td>{invoice.creator}</td>
                  <td>{invoice.total_products}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Накладные не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        {paginationInfo.previous && (
          <button onClick={() => handlePageChange(currentPage - 1)} className="action-button">Предыдущая</button>
        )}
        {paginationInfo.next && (
          <button onClick={() => handlePageChange(currentPage + 1)} className="action-button">Следующая</button>
        )}
        <p>Страница {currentPage} из {paginationInfo.totalPages}</p>
      </div>
    </div>
  );
};

export default Invoices;

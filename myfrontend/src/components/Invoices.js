import React, { useEffect, useState, useCallback } from 'react';
import invoiceService from '../services/invoiceService';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({});
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState({ invoiceNumber: '', barcode: '' });
  const [sortField, setSortField] = useState('date'); // Поле для сортировки по умолчанию
  const [sortOrder, setSortOrder] = useState('desc'); // Сортировка от позднего к раннему

  const openInvoiceDetails = (invoiceNumber) => {
    window.open(`/invoices/${invoiceNumber}`, '_blank');
  };

  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      const data = await invoiceService.getInvoices(
        searchQuery.invoiceNumber,
        searchQuery.barcode,
        sortField,
        sortOrder,
        page
      );
      setInvoices(data.results);
      setPaginationInfo({
        next: data.next,
        previous: data.previous,
        totalPages: Math.ceil(data.count / 100),
      });
    } catch (error) {
      console.error('Ошибка при получении накладных:', error);
    }
  }, [searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = () => {
    setSearchQuery({
      invoiceNumber: searchInvoiceNumber,
      barcode: searchBarcode,
    });
    setCurrentPage(1); // Сбрасываем на первую страницу
  };

  const handleSort = (field) => {
    // Меняем порядок сортировки, если поле совпадает
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Сбрасываем на первую страницу
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
        <button onClick={handleSearch}>Поиск</button>
      </div>
      <div className="table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('InvoiceNumber')} style={{ cursor: 'pointer' }}>
                Номер накладной {sortField === 'InvoiceNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                Дата {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
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

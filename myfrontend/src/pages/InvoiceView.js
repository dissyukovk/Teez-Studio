import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import * as XLSX from 'xlsx'; // Для работы с Excel
import './InvoiceView.css';

const InvoiceView = () => {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await invoiceService.getInvoiceDetails(invoiceNumber);
        
        // Сортируем продукты по полю "Ячейка"
        data.products = data.products.sort((a, b) => {
          if (a.cell && b.cell) {
            return a.cell.localeCompare(b.cell);
          }
          return 0;
        });

        setInvoice(data);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить данные накладной');
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('invoice-content').innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Печать накладной</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-products-table { width: 100%; border-collapse: collapse; }
            .invoice-products-table th, .invoice-products-table td { border: 1px solid #ddd; padding: 8px; }
            .signature-section { margin-top: 20px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownloadExcel = () => {
    if (!invoice) return;

    const worksheetData = invoice.products.map(product => ({
      'Штрихкод': product.barcode,
      'Наименование товара': product.name,
      'Количество': 1,
      'Ячейка': product.cell || 'Не указана',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Накладная');
    
    XLSX.writeFile(workbook, `Накладная №${invoiceNumber}.xlsx`);
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="invoice-view">
      <div className="button-container">
        <button className="print-button" onClick={handlePrint}>Печать</button>
        <button className="download-excel-button" onClick={handleDownloadExcel}>Скачать Excel</button>
      </div>
      <div id="invoice-content">
        <h1>Накладная № {invoiceNumber}</h1>
        <p>Дата создания: {invoice?.date ? new Date(invoice?.date).toLocaleString() : 'Нет даты'}</p>
        <table className="invoice-products-table">
          <thead>
            <tr>
              <th>Штрихкод</th>
              <th>Наименование товара</th>
              <th>Количество</th>
              <th>Ячейка</th>
            </tr>
          </thead>
          <tbody>
            {invoice?.products?.map((product) => (
              <tr key={product.barcode}>
                <td>{product.barcode}</td>
                <td>{product.name}</td>
                <td>1</td>
                <td>{product.cell || 'Не указана'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="signature-section">
          <span>Отправил:</span>
          <span>Получил:</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;

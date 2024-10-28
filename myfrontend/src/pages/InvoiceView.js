import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
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
    const printContent = document.getElementById('invoice-content').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Чтобы восстановить функционал после печати
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="invoice-view">
      <button className="print-button" onClick={handlePrint}>Печать</button>
      <div id="invoice-content">
        <h1>Накладная № {invoiceNumber}</h1>
        <p>Дата создания: {invoice?.date || 'Не указана'}</p>
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
                <td>1</td> {/* Указываем количество 1 для каждого товара */}
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

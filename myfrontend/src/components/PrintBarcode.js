import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import './PrintBarcode.css';

const PrintBarcode = () => {
  const [barcodeValue, setBarcodeValue] = useState(''); // Введенное значение штрихкода
  const barcodeRef = useRef(null); // Ссылка на элемент <svg> для штрихкода

  // Обновляем штрихкод при изменении значения
  useEffect(() => {
    if (barcodeValue.length === 13) { // Поддержка 13 цифр
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: 'CODE128',
        lineColor: '#000',
        width: 1,
        height: 45,
        displayValue: true,
        fontSize: 15,
        textMargin: 0,
        margin: 0,
      });
    }
  }, [barcodeValue]);

  // Обработчик ввода штрихкода
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Оставляем только цифры
    setBarcodeValue(value);
  };

  // Кнопка для печати
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-barcode-container">
      <h2 className="no-print">Печать ШК</h2>
      <div className="input-container no-print">
        <label>Введите штрихкод (13 цифр):</label>
        <input
          type="text"
          maxLength="13"
          value={barcodeValue}
          onChange={handleInputChange}
          placeholder="Например: 1234567890123"
        />
      </div>

      {barcodeValue.length === 13 && (
        <div className="barcode-display">
          <svg ref={barcodeRef}></svg>
        </div>
      )}

      <button onClick={handlePrint} className="print-button no-print">Печать</button>
    </div>
  );
};

export default PrintBarcode;

import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import './ProductModalStockman.css';
import authService from '../services/authService';

const ProductModalStockman = ({ barcode, closeModal }) => {
  const [productData, setProductData] = useState(null);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        // Получение данных о продукте по штрихкоду
        const response = await productService.getProductByBarcode(barcode);
        setProductData(response);
      } catch (error) {
        setErrorMessage('Ошибка при получении данных продукта');
      }
    };

    fetchProductData();
  }, [barcode]);

  const handleMarkAsDefective = async () => {
    try {
      const userId = await authService.getCurrentUserId();  // Получаем ID пользователя
  
      if (!userId) {
        throw new Error("Не удалось получить идентификатор пользователя.");
      }
  
      // Логирование операции с комментарием
      await productService.logDefectOperation(barcode, userId, comment);
  
      alert('Товар помечен как брак');
      closeModal();  // Закрываем модальное окно после операции
    } catch (error) {
      alert('Ошибка при пометке товара как брак');
    }
  };  

  const handleMarkAsOpened = async () => {
    try {
      const userId = await authService.getCurrentUserId();
      if (!userId) throw new Error("Не удалось получить идентификатор пользователя.");
  
      await productService.markAsOpened(barcode, userId);
      alert('Товар помечен как вскрыто');
      closeModal();
    } catch (error) {
      alert('Ошибка при пометке товара как вскрыто');
    }
  };  

  if (!productData) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>Информация о товаре</h2>
        <div><strong>Штрихкод:</strong> {productData.barcode}</div>
        <div><strong>Наименование:</strong> {productData.name}</div>
        <div><strong>Статус движения:</strong> {productData.move_status}</div>

        {/* Отображаем информацию о последней заявке */}
        <div><strong>Последняя заявка:</strong> 
          {productData.last_request.request_number ? (
            <>
              {productData.last_request.request_number} - {productData.last_request.request_status}
            </>
          ) : (
            <span style={{ color: 'red' }}>Нет заявок</span>
          )}
        </div>

        {/* Текстовое поле для комментария */}
        <div>
          <textarea
            placeholder="Введите комментарий"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Кнопка для пометки как "брак" */}
        <button onClick={handleMarkAsDefective} className="defect-button">Брак</button>
        <button onClick={handleMarkAsOpened} className="opened-button">Вскрыто</button>
        <button onClick={closeModal} className="close-button">Закрыть</button>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default ProductModalStockman;

import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import axios from 'axios';

const { TextArea } = Input;

const UpdateProductInfo = () => {
  const [barcodesMulti, setBarcodesMulti] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Преобразуем многострочную строку в массив штрихкодов
    const barcodes = barcodesMulti
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (!barcodes.length) {
      message.error("Введите хотя бы один штрихкод");
      return;
    }
    if (!info) {
      message.error("Поле 'info' не должно быть пустым");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://192.168.7.230:8000/products/update-info/', { barcodes, info });
      message.success(response.data.message || "Информация обновлена");
      // Очищаем поля после успешного ответа
      setBarcodesMulti('');
      setInfo('');
    } catch (error) {
      console.error("Ошибка обновления:", error);
      message.error("Ошибка обновления информации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginLeft: 200, // Резервируем 200px слева для сайдбара
        marginTop: 20,   // Отступ сверху в 20px
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div style={{ width: 400 }}>
        <h2>Обновление информации товаров</h2>
        <div style={{ marginBottom: 16 }}>
          <TextArea
            placeholder="Введите штрихкоды (каждый на новой строке)"
            value={barcodesMulti}
            onChange={(e) => setBarcodesMulti(e.target.value)}
            rows={6}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Введите новое значение для поля info"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
        </div>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Обновить информацию
        </Button>
      </div>
    </div>
  );
};

export default UpdateProductInfo;

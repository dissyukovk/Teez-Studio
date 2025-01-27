import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, message } from 'antd';
import axios from 'axios';
import * as XLSX from 'xlsx';

const { TextArea } = Input; // для многострочного ввода

const ReadyPhotosPage = () => {
  // Данные для таблицы
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Параметры фильтра
  const [barcodesMulti, setBarcodesMulti] = useState(''); // многострочный ввод для штрихкодов
  const [seller, setSeller] = useState('');               // поиск по ID магазина

  // Параметры сортировки/пагинации
  const [ordering, setOrdering] = useState('-retouch_request__creation_date'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Колонки таблицы
  const columns = [
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      sorter: true, // говорим antd, что колонка поддерживает сортировку
    },
    {
      title: 'Наименование',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: true,
    },
    {
      title: 'ID магазина',
      dataIndex: 'seller',
      key: 'seller',
      sorter: true,
    },
    {
      title: 'Ссылка на готовые фото',
      dataIndex: 'retouch_link',
      key: 'retouch_link',
      render: (text) => {
        if (!text) return '-';
        return (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        );
      },
    },
  ];

  // Функция загрузки данных (server-side filter & sort)
  const fetchData = async (page = 1, size = 50, order = '-retouch_request__creation_date') => {
    setLoading(true);
    try {
      // Собираем query-параметры
      const params = {
        page,
        page_size: size,
        ordering: order, // например, -retouch_request__creation_date
      };

      // Если пользователь ввёл несколько штрихкодов (каждый на своей строке),
      // объединим их в одну строку через запятую
      if (barcodesMulti.trim()) {
        const lines = barcodesMulti
          .split('\n')        // разбиваем по строкам
          .map((l) => l.trim())
          .filter(Boolean);   // убираем пустые
        params.barcodes = lines.join(','); 
      }

      if (seller.trim()) {
        // Если бэкенд поддерживает ?seller=...,
        // возможно, нужно поле ?search_seller=... — зависит от логики
        params.seller = seller.trim();
      }

      const response = await axios.get('http://192.168.7.230:8000/ft/ready-photos/', { params });
      const results = response.data.results || [];
      setData(results);
      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Первичная загрузка
  useEffect(() => {
    fetchData(currentPage, pageSize, ordering);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // При изменении в таблице (пагинация, сортировка)
  const handleTableChange = (pagination, filters, sorter) => {
    // sorter: { field, order } => order "ascend" / "descend" / undefined
    let newOrdering = ordering;
    if (sorter.field) {
      newOrdering = sorter.order === 'descend'
        ? `-${sorter.field}`
        : sorter.field;
    }

    fetchData(
      pagination.current,
      pagination.pageSize,
      newOrdering
    );
  };

  // Кнопка "Поиск"
  const handleSearch = () => {
    fetchData(1, pageSize, ordering);
  };

  // Кнопка "Экспорт в Excel"
  const handleExportExcel = async () => {
    try {
      // Загружаем все данные (без пагинации)
      const params = {
        page_size: 999999,
        ordering,
      };

      if (barcodesMulti.trim()) {
        const lines = barcodesMulti
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        params.barcodes = lines.join(',');
      }

      if (seller.trim()) {
        params.seller = seller.trim();
      }

      const resp = await axios.get('http://192.168.7.230:8000/ft/ready-photos/', { params });
      const allResults = resp.data.results || [];

      // Формируем массив для Excel
      const wsData = allResults.map(item => ({
        'Штрихкод': Number(item.barcode) || item.barcode, // если хотим числовой
        'Наименование': item.product_name || '',
        'ID_магазина': item.seller || 0,
        'Ссылка': item.retouch_link || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ReadyPhotos');

      const now = new Date();
      const fileName = `ready_photos_${now.toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success('Файл Excel сформирован');
    } catch (error) {
      console.error('Excel export error:', error);
      message.error('Ошибка экспорта в Excel');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Готовые фото</h2>
      <Space style={{ marginBottom: 16 }}>
        {/* Многострочное поле для штрихкодов */}
        <TextArea
          placeholder="Вставьте штрихкоды, каждый в новой строке"
          value={barcodesMulti}
          onChange={(e) => setBarcodesMulti(e.target.value)}
          style={{ width: 300 }}
          rows={4}
        />
        <Input
          placeholder="ID магазина"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          style={{ width: 180 }}
        />
        <Button type="primary" onClick={handleSearch}>
          Поиск
        </Button>
        <Button onClick={handleExportExcel}>
          Скачать в Excel
        </Button>
      </Space>

      <Table
        rowKey={(record) => `${record.barcode}_${record.seller}`}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ReadyPhotosPage;

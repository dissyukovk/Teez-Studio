import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './ReadyPhotos.css'; // Assuming your styles are in ReadyPhotos.css

const ReadyPhotos = () => {
    const [photos, setPhotos] = useState([]);
    const [barcode, setBarcode] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [date, setDate] = useState('');
    const [sortField, setSortField] = useState('barcode');
    const [sortOrder, setSortOrder] = useState('asc');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch paginated data
    const fetchData = async () => {
        try {
            const response = await axios.get('http://192.168.6.56:8000/public/ready-photos/', {
                params: {
                    barcode: barcode || undefined,
                    seller_id: sellerId || undefined,
                    date: date || undefined,
                    sort_field: sortField,
                    sort_order: sortOrder,
                    page: page,
                    page_size: 100,
                },
            });
            setPhotos(response.data.results);
            setTotalPages(Math.ceil(response.data.count / 100)); // Assuming 'count' is the total number of records
        } catch (error) {
            console.error("Error fetching ready photos:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [barcode, sellerId, date, sortField, sortOrder, page]);

    const handleSortChange = (field) => {
        setSortField(field);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Download all filtered data as Excel
    const downloadData = async () => {
        try {
            const response = await axios.get('http://192.168.6.56:8000/public/ready-photos/', {
                params: {
                    barcode: barcode || undefined,
                    seller_id: sellerId || undefined,
                    date: date || undefined,
                    sort_field: sortField,
                    sort_order: sortOrder,
                    page_size: 10000,  // A large number to get all results without pagination
                },
            });

            const data = response.data.results || response.data;
            const formattedData = data.map(photo => ({
                'Штрихкод': photo.barcode,
                'Наименование': photo.name,
                'ID магазина': photo.seller_id,
                'Ссылка на фото': photo.retouch_link,
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'ReadyPhotos');

            const now = new Date();
            const formattedDate = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
            const filename = `readyphotos_${formattedDate}.xlsx`;

            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error("Error downloading data:", error);
        }
    };

    return (
        <div className="ready-photos-container">
            <h2 className="ready-photos-header">Готовые фотографии для скачивания</h2>

            {/* Search Fields */}
            <div className="search-bar">
                <label>
                    Поиск по штрихкоду:
                    <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Введите штрихкод"
                    />
                </label>
                <label>
                    Поиск по ID магазина:
                    <input
                        type="text"
                        value={sellerId}
                        onChange={(e) => setSellerId(e.target.value)}
                        placeholder="Введите ID магазина"
                    />
                </label>
                <label>
                    Дата:
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </label>
                <button onClick={downloadData} className="download-button">
                    Скачать Excel
                </button>
            </div>

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleSortChange('barcode')}>Штрихкод</th>
                        <th onClick={() => handleSortChange('name')}>Наименование</th>
                        <th onClick={() => handleSortChange('seller_id')}>ID магазина</th>
                        <th>Ссылка на фото</th>
                    </tr>
                </thead>
                <tbody>
                    {photos.length > 0 ? (
                        photos.map((photo, index) => (
                            <tr key={index}>
                                <td>{photo.barcode}</td>
                                <td>{photo.name}</td>
                                <td>{photo.seller_id}</td>
                                <td>
                                    <a href={photo.retouch_link} target="_blank" rel="noopener noreferrer">
                                        {photo.retouch_link}
                                    </a>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="no-results">Нет результатов для отображения</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination-controls">
                <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Назад
                </button>
                <span>Страница {page} из {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                    Вперед
                </button>
            </div>
        </div>
    );
};

export default ReadyPhotos;

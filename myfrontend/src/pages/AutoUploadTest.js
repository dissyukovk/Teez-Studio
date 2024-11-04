import React, { useState } from 'react';

const API_KEY = 'AIzaSyBGBcR20R_hQP_yNrfA_L2oWl-0G75BR84';

const AutoUploadTest = () => {
    const [folderLink, setFolderLink] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const barcodes = [
        "1000028153602",
        "1000028152346",
        "1000028152049",
        "1000028152230",
        "1000028151240"
    ];

    const extractFolderId = (link) => {
        const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const loadFiles = async () => {
        const folderId = extractFolderId(folderLink);
        if (!folderId) {
            alert("Некорректная ссылка на папку");
            return;
        }
    
        setLoading(true);
    
        try {
            const query = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`);
            const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
    
            console.log("Ответ от Google Drive API:", data); // Для отладки

            if (response.ok && data.files) {
                // Фильтруем папки по штрихкодам
                const files = barcodes.map(barcode => {
                    const file = data.files.find(file => file.name === barcode);
                    return { barcode, link: file ? `https://drive.google.com/drive/folders/${file.id}` : 'Файл не найден' };
                });
                setResults(files);
            } else {
                alert("Ошибка при запросе к Google Drive API");
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Не удалось выполнить запрос");
        }
    
        setLoading(false);
    };

    return (
        <div>
            <h1>Автоаплоад Тест</h1>
            <div>
                <label htmlFor="folder-link">Ссылка на папку:</label>
                <input
                    type="text"
                    id="folder-link"
                    placeholder="https://drive.google.com/drive/folders/your-folder-id"
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                />
                <button onClick={loadFiles} disabled={loading}>
                    {loading ? "Загрузка..." : "Загрузить"}
                </button>
            </div>

            <h2>Результаты</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Штрихкод</th>
                        <th>Ссылка на файл</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((result) => (
                        <tr key={result.barcode}>
                            <td>{result.barcode}</td>
                            <td>
                                {result.link === 'Файл не найден' ? (
                                    "Файл не найден"
                                ) : (
                                    <a href={result.link} target="_blank" rel="noopener noreferrer">
                                        Открыть файл
                                    </a>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AutoUploadTest;

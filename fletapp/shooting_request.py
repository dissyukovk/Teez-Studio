import flet as ft
import os
import requests
import threading
import base64
from time import sleep
from PIL import Image, ExifTags
from camera_state import camera_state
from config import API_BASE_URL
from utils import show_snack_bar


def start_shooting(token, request_number, page, content_container):
    """Функция для начала съемки заявки."""
    new_files = []  # Новые файлы с камеры
    old_files = []  # Сохраненные файлы с камеры (до начала съемки)

    def fetch_files_from_camera():
        """Получение списка файлов с камеры."""
        if not camera_state.ip:
            show_snack_bar(page, "IP камеры не определен. Сначала подключите камеру.")
            return []

        url = f"http://{camera_state.ip}:8080/ccapi/ver130/contents/card1/100CANON/"
        print(f"[DEBUG] Запрос списка файлов с камеры по URL: {url}")
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                if "path" in data:
                    files = data["path"]
                    print(f"[INFO] Получен список файлов с камеры: {files}")
                    return files
                else:
                    print(f"[ERROR] Ключ 'path' отсутствует в ответе: {data}")
                    return []
            else:
                print(f"[ERROR] Ошибка получения файлов с камеры: {response.status_code} {response.text}")
                return []
        except Exception as ex:
            print(f"[ERROR] Ошибка подключения к камере: {ex}")
            return []

    def save_and_process_file(file_url, file_name, progress_bar):
        """Сохранение файла и его обработка с помощью Pillow."""
        file_name = os.path.basename(file_name)

        original_path = os.path.join(
            "C:\\Users\\dissy\\OneDrive\\Документы\\GitHub\\Teez-Studio\\fletapp\\downloads", file_name
        )
        temp_path = os.path.join(
            "C:\\Users\\dissy\\OneDrive\\Документы\\GitHub\\Teez-Studio\\fletapp\\temp", file_name
        )

        print(f"[DEBUG] Сохранение файла {file_name} из URL: {file_url}")
        try:
            with requests.get(file_url, stream=True) as response:
                if response.status_code == 200:
                    total_length = int(response.headers.get("Content-Length", 0))
                    downloaded = 0
                    with open(original_path, "wb") as f:
                        for chunk in response.iter_content(chunk_size=1024):
                            if chunk:
                                f.write(chunk)
                                downloaded += len(chunk)
                                progress_bar.value = min(downloaded / total_length, 1.0)
                                progress_bar.update()

                    print(f"[INFO] Файл {file_name} успешно сохранен: {original_path}")

                    # Обработка изображения
                    with Image.open(original_path) as img:
                        # Сохраняем ориентацию
                        for orientation in ExifTags.TAGS.keys():
                            if ExifTags.TAGS[orientation] == 'Orientation':
                                break
                        try:
                            exif = dict(img._getexif().items())
                            if orientation in exif:
                                if exif[orientation] == 3:
                                    img = img.rotate(180, expand=True)
                                elif exif[orientation] == 6:
                                    img = img.rotate(270, expand=True)
                                elif exif[orientation] == 8:
                                    img = img.rotate(90, expand=True)
                        except (AttributeError, KeyError, IndexError):
                            print("[INFO] Нет информации об ориентации.")

                        img.thumbnail((500, 666))
                        img.save(temp_path, "JPEG")
                    print(f"[INFO] Файл {file_name} обработан и сохранен: {temp_path}")
                    return temp_path
                else:
                    print(f"[ERROR] Ошибка загрузки файла {file_name}: {response.status_code}")
                    return None
        except Exception as ex:
            print(f"[ERROR] Ошибка сохранения и обработки файла {file_name}: {ex}")
            return None

    def update_file_display():
        """Обновление отображения новых файлов."""
        nonlocal new_files
        print(f"[DEBUG] Начало обновления отображения для файлов: {new_files}")
        for file_name in new_files:
            file_url = f"http://{camera_state.ip}:8080{file_name}"
            base_name = os.path.basename(file_name)  # Извлекаем только имя файла
            print(f"[DEBUG] Обработка файла {base_name} по URL: {file_url}")

            if any(control.tooltip == base_name for control in file_list.controls):
                print(f"[INFO] Файл {base_name} уже отображается, пропускаем.")
                continue

            # Добавляем прогрессбар и обновляем интерфейс
            progress_container = ft.Column()
            progress_bar = ft.ProgressBar(width=150, height=10, value=0, tooltip=f"Загрузка: {base_name}")
            progress_container.controls.append(progress_bar)
            file_list.controls.append(progress_container)
            file_list.update()  # Принудительно обновляем интерфейс
            print("[DEBUG] Прогрессбар добавлен в интерфейс и интерфейс обновлён.")

            try:
                # Сохранение и обработка файла
                processed_file_path = save_and_process_file(file_url, file_name, progress_bar)
                if processed_file_path and os.path.exists(processed_file_path):
                    print(f"[INFO] Файл {base_name} успешно обработан для отображения.")

                    # Убираем прогрессбар и добавляем изображение напрямую из temp
                    progress_container.controls.clear()
                    progress_container.controls.append(
                        ft.Image(
                            src=processed_file_path,  # Используем локальный файл
                            fit="contain",
                            tooltip=base_name,
                        )
                    )
                    print(f"[INFO] Изображение {base_name} добавлено в интерфейс из обработанного файла.")
                else:
                    print(f"[ERROR] Файл {base_name} не найден после обработки.")
                    show_snack_bar(page, f"Файл {base_name} отсутствует.")
                    file_list.controls.remove(progress_container)
            except Exception as e:
                print(f"[ERROR] При обработке файла {base_name}: {e}")
                show_snack_bar(page, f"Ошибка загрузки {base_name}")

        # Обновляем список файлов после добавления всех изображений
        file_list.update()
        print("[DEBUG] Список файлов обновлён.")

    def validate_barcode(e):
        """Проверка штрихкода в заявке."""
        barcode = e.control.value.strip()
        if not barcode.isdigit() or len(barcode) != 13:
            print(f"[ERROR] Некорректный штрихкод: {barcode}")
            show_snack_bar(page, "Введите корректный штрихкод (13 цифр)")
            return

        print(f"[INFO] Проверяем штрихкод {barcode} в заявке {request_number}")
        request_url = f"{API_BASE_URL}/ft/photographer-request/{request_number}/"
        try:
            response = requests.get(request_url, headers={"Authorization": f"Bearer {token}"})
            if response.status_code != 200:
                print(f"[ERROR] Загрузка заявки: {response.status_code} - {response.text}")
                show_snack_bar(page, "Ошибка загрузки заявки")
                return

            request_data = response.json()
            print(f"[INFO] Данные заявки: {request_data}")
            if not any(product["barcode"] == barcode for product in request_data["products"]):
                print(f"[ERROR] Штрихкод {barcode} не найден в заявке {request_number}")
                show_snack_bar(page, "Данного штрихкода нет в заявке")
                return

            product_url = f"{API_BASE_URL}/ft/photographerproduct/{barcode}/"
            print(f"[INFO] Отправляем запрос на детали продукта: {product_url}")
            product_response = requests.get(product_url, headers={"Authorization": f"Bearer {token}"})
            if product_response.status_code == 200:
                product_data = product_response.json()
                print(f"[INFO] Детали продукта: {product_data}")
                product_info.controls.clear()
                product_info.controls.append(ft.Text(f"Штрихкод: {barcode}"))
                product_info.controls.append(ft.Text(f"Наименование: {product_data['name']}"))
                product_info.controls.append(ft.Text(f"Категория: {product_data['category']}"))
                if product_data.get("reference_link"):
                    product_info.controls.append(
                        ft.ElevatedButton(
                            text="Ссылка на референс",
                            on_click=lambda e: page.launch_url(product_data["reference_link"]),
                        )
                    )
                product_info.update()
            else:
                print(f"[ERROR] Загрузка деталей продукта: {product_response.status_code}")
                show_snack_bar(page, "Ошибка загрузки деталей продукта")
        except Exception as ex:
            print(f"[ERROR] Подключение: {ex}")
            show_snack_bar(page, f"Ошибка подключения: {ex}")

    def monitor_new_files():
        """Мониторинг новых файлов на камере."""
        nonlocal old_files, new_files
        print(f"[DEBUG] Старт мониторинга новых файлов")
        while True:
            try:
                current_files = fetch_files_from_camera()
                print(f"[DEBUG] Текущий список файлов: {current_files}")
                if current_files:
                    new_files = list(set(current_files) - set(old_files))
                    if new_files:
                        print(f"[INFO] Найдены новые файлы: {new_files}")
                        update_file_display()
                        old_files.extend(new_files)
                sleep(5)
            except Exception as e:
                print(f"[ERROR] Ошибка мониторинга новых файлов: {e}")

    downloads_path = "C:\\Users\\dissy\\OneDrive\\Документы\\GitHub\\Teez-Studio\\fletapp\\downloads"
    temp_path = "C:\\Users\\dissy\\OneDrive\\Документы\\GitHub\\Teez-Studio\\fletapp\\temp"
    os.makedirs(downloads_path, exist_ok=True)
    os.makedirs(temp_path, exist_ok=True)

    old_files = fetch_files_from_camera()
    print(f"[INFO] Файлы на камере до начала съемки: {old_files}")

    product_info = ft.Column()

    barcode_field = ft.TextField(
        label="Введите штрихкод",
        autofocus=True,
        keyboard_type=ft.KeyboardType.NUMBER,
        on_change=lambda e: validate_barcode(e) if len(e.control.value) == 13 else None,
        width=300,
    )

    file_list = ft.GridView(
        expand=True,
        runs_count=3,
        max_extent=150,
        spacing=10,
        run_spacing=10,
    )

    content_container.content = ft.Column(
        controls=[
            ft.ElevatedButton(text="Назад", on_click=lambda e: page.go_back()),
            ft.Text(f"Съемка заявки №{request_number}", size=20, weight="bold"),
            barcode_field,
            product_info,
            ft.Text("Список новых файлов:"),
            file_list,
        ],
        expand=True,
    )
    page.update()

    threading.Thread(target=monitor_new_files, daemon=True).start()

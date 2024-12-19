import flet as ft
import os
import shutil
import threading
import requests
from time import sleep
from datetime import datetime
from config import API_BASE_URL
from utils import show_snack_bar
from camera_state import camera_state
from PIL import Image, ExifTags
from threading import Lock

GOOGLE_DRIVE_FOLDER_ID = "139z7j-n-oWhlD38UwpNenEaWtlYJE5C1"
LOCAL_GOOGLE_DRIVE_PATH = r"G:\Общие диски\Media\ФОТОГРАФЫ"
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
API_KEY = "AIzaSyBGBcR20R_hQP_yNrfA_L2oWl-0G75BR84"

def start_shooting(token, request_number, page, content_container, return_to_requests_page, user_data):
    # Предполагается, что user_data уже содержит 'first_name' и 'last_name' после логина
    first_name = user_data.get("first_name", "Unknown")
    last_name = user_data.get("last_name", "Unknown")

    monitored_directory = r"C:\Users\dissy\OneDrive\Изображения\dev_fletapp\1"
    download_base_directory = "./downloads"
    os.makedirs(download_base_directory, exist_ok=True)

    all_images = []
    barcode = None
    image_directory = None
    processed_files = set()

    username = f"{first_name}_{last_name}"
    today_date = datetime.now().strftime("%d.%m.%Y")

    start_monitoring = threading.Event()
    photo_status_radio_group = None

    def fetch_files_from_camera_with_retries(retry_attempts=3):
        """Получение списка файлов с камеры с логами ошибок."""
        if not camera_state.ip:
            print("[ERROR] Camera IP is not установлен. Пропускаем опрос камеры.")
            return None  # Возвращаем None, чтобы отличать от пустого списка

        url = f"http://{camera_state.ip}:8080/ccapi/ver130/contents/card1/100CANON/"
        for attempt in range(retry_attempts):
            try:
                print(f"[DEBUG] Попытка {attempt + 1} запроса файлов с камеры: {url}")
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if "path" in data:
                        files = data["path"]
                        print(f"[INFO] Успешно получен список файлов с камеры: {files}")
                        return set(files)  # Возвращаем набор файлов
                    else:
                        print(f"[ERROR] Ключ 'path' отсутствует в ответе: {data}")
                        return None  # Ошибка в структуре ответа
                else:
                    print(f"[ERROR] Некорректный статус ответа: {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"[ERROR] Попытка {attempt + 1}: Ошибка подключения к камере: {e}")
            sleep(2)  # Задержка между попытками
        return None  # Возвращаем None, если все попытки завершились неудачей

    download_lock = Lock()

    def download_file_from_camera(file_name, retry_attempts=3):
        with download_lock:
            """Download a file from the camera with retries."""
            if not camera_state.ip or not image_directory:
                print("[ERROR] Camera IP or image_directory is not set. Skipping download.")
                return None

            # Убедимся, что `file_name` содержит относительный путь
            if file_name.startswith("/ccapi/ver130/"):
                file_url = f"http://{camera_state.ip}:8080{file_name}"
            else:
                file_url = f"http://{camera_state.ip}:8080/ccapi/ver130/contents/card1/100CANON/{file_name}"

            local_path = os.path.join(image_directory, os.path.basename(file_name))
            print(f"[DEBUG] Локальный путь для сохранения файла: {local_path}")

            for attempt in range(retry_attempts):
                try:
                    response = requests.get(file_url, stream=True, timeout=50)
                    if response.status_code == 200:
                        with open(local_path, "wb") as file:
                            for chunk in response.iter_content(chunk_size=1024):
                                file.write(chunk)
                        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                            print(f"[INFO] Successfully downloaded file {file_name}")
                            return os.path.basename(local_path)
                        else:
                            print(f"[ERROR] File {file_name} downloaded but is empty.")
                    else:
                        print(
                            f"[ERROR] Failed to download file {file_name}, attempt {attempt + 1}. Status: {response.status_code}")
                except requests.exceptions.RequestException as e:
                    print(f"[ERROR] Download error for file {file_name} on attempt {attempt + 1}: {e}")
                sleep(1)
            return None

    def copy_file(file_name):
        """Копирование файлов в папку назначения."""
        source_path = os.path.join(monitored_directory, file_name)
        destination_path = os.path.join(image_directory, file_name)
        try:
            shutil.copy(source_path, destination_path)
            print(f"[INFO] Файл {file_name} успешно скопирован в {destination_path}")
            return destination_path
        except Exception as e:
            print(f"[ERROR] Ошибка копирования файла {file_name}: {e}")
            return None

    def update_file_display(new_files):
        """Обновление интерфейса для новых файлов."""
        for file_name in new_files:
            copied_file_path = copy_file(file_name)
            if copied_file_path and file_name not in all_images:
                all_images.append(file_name)
        update_images()

    def extract_exif_data(image_path):
        """Извлечение EXIF-данных из изображения."""
        try:
            image = Image.open(image_path)
            exif_data = image._getexif()
            if not exif_data:
                return {}

            exif = {
                ExifTags.TAGS[key]: value
                for key, value in exif_data.items()
                if key in ExifTags.TAGS
            }

            fnumber = exif.get("FNumber")
            exposure_time = exif.get("ExposureTime")
            iso = exif.get("ISOSpeedRatings")
            focal_length = exif.get("FocalLength")

            # Преобразуем ISO в число, если это строка
            if isinstance(iso, str):
                try:
                    iso = int(iso)
                except ValueError:
                    iso = None

            return {
                "Диафрагма": f"f/{fnumber.numerator / fnumber.denominator}" if fnumber else "N/A",
                "Выдержка": f"1/{int(1 / (exposure_time.numerator / exposure_time.denominator))}" if exposure_time else "N/A",
                "ISO": iso if iso else "N/A",
                "Фокусное расстояние": f"{focal_length.numerator / focal_length.denominator} мм" if focal_length else "N/A",
            }
        except Exception as e:
            print(f"[ERROR] Не удалось извлечь EXIF: {e}")
            return {
                "Диафрагма": "N/A",
                "Выдержка": "N/A",
                "ISO": "N/A",
                "Фокусное расстояние": "N/A",
            }

    def confirm_delete_image(index):
        """Подтверждение удаления изображения."""
        img_to_delete = all_images[index]
        confirmation_dialog = ft.AlertDialog(
            title=ft.Text("Подтверждение удаления"),
            content=ft.Text(f"Вы действительно хотите удалить файл '{img_to_delete}'?"),
            actions=[
                ft.ElevatedButton(
                    "Удалить",
                    on_click=lambda e: delete_image(index, confirmation_dialog),
                ),
                ft.ElevatedButton(
                    "Отмена",
                    on_click=lambda e: close_dialog(confirmation_dialog),
                ),
            ],
        )

        def close_dialog(dialog):
            dialog.open = False
            page.update()

        page.dialog = confirmation_dialog
        confirmation_dialog.open = True
        page.update()

    def delete_image(index, dialog):
        """Удаление изображения."""
        img_to_delete = all_images.pop(index)
        os.remove(os.path.join(image_directory, img_to_delete))
        dialog.open = False
        update_images()

    def show_full_screen(image_path):
        """Показ изображения в полноэкранном режиме."""
        exif_info = extract_exif_data(image_path)

        def get_text_style(key, value):
            if key == "Диафрагма" and value != "f/16.0":
                return ft.TextStyle(color="#994700")
            elif key == "Выдержка" and value != "1/125":
                return ft.TextStyle(color="#994700")
            elif key == "ISO" and value != "100":
                return ft.TextStyle(color="#994700")
            return ft.TextStyle()

        exif_container = ft.Column(
            controls=[
                ft.Text(f"{key}: {value}", size=16, style=get_text_style(key, value))
                for key, value in exif_info.items()
            ],
            spacing=5,
            alignment="start",
        )

        interactive_image_viewer = ft.Container(
            content=ft.InteractiveViewer(
                min_scale=0.1,
                max_scale=5,
                boundary_margin=ft.margin.all(20),
                content=ft.Image(
                    src=image_path,
                    fit="contain",
                    expand=True,
                ),
            ),
            on_click=lambda e: close_full_screen(),
        )

        full_screen_dialog = ft.AlertDialog(
            modal=True,
            content=ft.Row(
                controls=[
                    ft.Container(content=interactive_image_viewer, expand=True),
                    ft.Container(content=exif_container, padding=20, width=250),
                ],
                alignment="start",
                expand=True,
            ),
            on_dismiss=lambda e: close_full_screen(),
        )

        def close_full_screen():
            full_screen_dialog.open = False
            page.dialog = None
            page.update()

        def handle_key_down(e):
            if e.key == "Escape":
                close_full_screen()

        page.on_key_down = handle_key_down

        page.dialog = full_screen_dialog
        full_screen_dialog.open = True
        page.update()

    def update_images():
        """Обновление отображения изображений."""
        top_controls.controls.clear()

        row = ft.Row(spacing=15, wrap=True, alignment="start", expand=True)
        image_width = 150
        control_width = image_width

        for idx, img in enumerate(all_images):
            image_path = os.path.abspath(os.path.join(image_directory, os.path.basename(img)))
            print(f"[DEBUG] Добавляем изображение в интерфейс: {image_path}")

            if not os.path.exists(image_path):
                print(f"[ERROR] Файл не найден: {image_path}. Пропускаем.")
                continue

            img_container = ft.Column(
                controls=[
                    ft.GestureDetector(
                        content=ft.Image(
                            src=image_path,
                            width=image_width,
                            height=200,
                            fit="contain",
                            tooltip=img,
                        ),
                        on_tap=lambda e, path=image_path: show_full_screen(path),
                    ),
                    ft.Row(
                        controls=[
                            ft.IconButton(
                                icon=ft.icons.ARROW_BACK,
                                on_click=lambda e, i=idx: move_image(i, -1),
                                disabled=idx == 0,
                            ),
                            ft.IconButton(
                                icon=ft.icons.DELETE,
                                on_click=lambda e, i=idx: confirm_delete_image(i),
                            ),
                            ft.IconButton(
                                icon=ft.icons.ARROW_FORWARD,
                                on_click=lambda e, i=idx: move_image(i, 1),
                                disabled=idx == len(all_images) - 1,
                            ),
                        ],
                        alignment="center",
                        spacing=5,
                        width=control_width,
                    ),
                ],
                alignment="center",
                spacing=5,
            )
            row.controls.append(img_container)

        top_controls.controls.append(row)
        print("[DEBUG] Обновление интерфейса завершено.")
        print(f"[DEBUG] Список изображений для отображения: {all_images}")
        print(f"[DEBUG] Текущая директория для изображений: {image_directory}")
        page.update()

    def move_image(index, direction):
        new_index = index + direction
        if 0 <= new_index < len(all_images):
            all_images[index], all_images[new_index] = all_images[new_index], all_images[index]
            update_images()

    def validate_barcode(e):
        nonlocal barcode, image_directory, photo_status_radio_group

        barcode = e.control.value.strip()
        if not barcode.isdigit() or len(barcode) != 13:
            show_snack_bar(page, "Введите корректный штрихкод (13 цифр)")
            return

        product_url = f"{API_BASE_URL}/ft/photographerproduct/{barcode}/?request_number={request_number}"
        try:
            product_response = requests.get(product_url, headers={"Authorization": f"Bearer {token}"})
            if product_response.status_code == 200:
                product_data = product_response.json()
                image_directory = os.path.abspath(os.path.join(download_base_directory, request_number, barcode))
                print(f"[DEBUG] Установлен путь директории для изображений: {image_directory}")
                if not os.path.exists(image_directory):
                    os.makedirs(image_directory, exist_ok=True)

                # Создание локальной папки для Google Drive
                local_drive_path = os.path.join(LOCAL_GOOGLE_DRIVE_PATH, username, today_date, request_number, barcode)
                if not os.path.exists(local_drive_path):
                    os.makedirs(local_drive_path, exist_ok=True)
                    print(f"[INFO] Локальная папка для Google Drive создана: {local_drive_path}")
                else:
                    print(f"[INFO] Локальная папка для Google Drive уже существует: {local_drive_path}")

                # Обновляем интерфейс
                barcode_field.value = barcode
                barcode_field.disabled = True
                barcode_field.update()

                product_info.controls.clear()
                product_info.controls.append(
                    ft.Row(
                        controls=[
                            ft.Text(f"Наименование: {product_data['name']}", size=16),
                            ft.Text(f"Категория: {product_data['category']}", size=16),
                            ft.ElevatedButton(
                                text="Ссылка на референс",
                                on_click=lambda e: page.launch_url(product_data["reference_link"]),
                            ),
                        ],
                        alignment="spaceBetween",
                    )
                )
                product_info.controls.append(
                    ft.Text(f"Комментарий старшего фотографа: {product_data['comment']}", size=22)
                )

                photo_status_radio_group = ft.RadioGroup(
                    value="Готово",  # Значение по умолчанию
                    on_change=lambda e: print(f"Выбран статус: {e.control.value}"),
                    content=ft.Row(
                        controls=[
                            ft.Radio(value="Готово", label="Готово"),
                            ft.Radio(value="Брак", label="Брак"),
                            ft.Radio(value="НТВ", label="НТВ"),
                        ],
                        spacing=20,
                        alignment="start",
                    ),
                )

                product_info.controls.append(
                    ft.Container(
                        content=photo_status_radio_group,
                        padding=ft.padding.only(top=10),
                    )
                )

                # Добавляем кнопку "Загрузить на Google Drive"
                product_info.controls.append(
                    ft.Row(
                        controls=[
                            ft.ElevatedButton(
                                text="Загрузить на Google Drive",
                                on_click=lambda e: upload_all_to_drive(),
                            ),
                            progress_bar,
                        ],
                        alignment="center",
                        spacing=10,
                    )
                )

                product_info.update()

                # Добавляем существующие файлы
                existing_files = {f for f in os.listdir(image_directory) if
                                  f.lower().endswith((".jpg", ".jpeg", ".png"))}
                processed_files.update(existing_files)
                all_images.extend(existing_files)
                update_images()

                # Запускаем мониторинг файлов после успешной валидации
                print("[INFO] Валидация завершена успешно. Запускаем мониторинг файлов.")
                start_monitoring.set()  # Активируем мониторинг

            else:
                show_snack_bar(page, "Ошибка загрузки деталей продукта!")
        except Exception as ex:
            show_snack_bar(page, f"Ошибка подключения: {ex}")

    def clear_folder(folder_path):
        if os.path.exists(folder_path):
            for file in os.listdir(folder_path):
                file_path = os.path.join(folder_path, file)
                if os.path.isfile(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)

    def search_folder(parent_id, folder_name):
        query = (
            f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and '{parent_id}' in parents"
            f" and trashed=false"
        )
        url = (
            f"https://www.googleapis.com/drive/v3/files?"
            f"q={query}&includeItemsFromAllDrives=true&supportsAllDrives=true&key={API_KEY}"
        )
        response = requests.get(url)
        if response.status_code == 200:
            files = response.json().get("files", [])
            if files:
                return files[0]["id"]
        print(f"[ERROR] Папка '{folder_name}' не найдена в родительской папке {parent_id}.")
        return None

    def get_folder_link():
        current_parent_id = GOOGLE_DRIVE_FOLDER_ID
        folder_hierarchy = [username, today_date, request_number, barcode]

        for folder_name in folder_hierarchy:
            folder_id = search_folder(current_parent_id, folder_name)
            if not folder_id:
                print(f"[ERROR] Папка '{folder_name}' не найдена.")
                return None
            current_parent_id = folder_id

        folder_link = f"https://drive.google.com/drive/folders/{current_parent_id}"
        print(f"[INFO] Ссылка на папку: {folder_link}")
        return folder_link

    def upload_all_to_drive():
        if not all_images:
            show_snack_bar(page, "Нет файлов для загрузки!")
            return

        local_folder_path = os.path.join(
            LOCAL_GOOGLE_DRIVE_PATH, username, today_date, request_number, barcode
        )

        clear_folder(local_folder_path)
        os.makedirs(local_folder_path, exist_ok=True)

        total_steps = len(all_images) + 2
        current_step = 0

        progress_bar.visible = True
        progress_bar.value = 0
        progress_bar.update()

        for idx, img in enumerate(all_images):
            source_path = os.path.join(image_directory, img)
            dest_path = os.path.join(local_folder_path, f"{barcode}_{idx + 1}.jpg")
            shutil.copy(source_path, dest_path)

            current_step += 1
            progress_bar.value = current_step / total_steps
            progress_bar.update()
            sleep(0.5)

        sleep(8)  # Имитация синхронизации

        folder_link = None
        try:
            folder_link = get_folder_link()
            if folder_link:
                show_snack_bar(page, f"Ссылка на папку: {folder_link}")
            else:
                show_snack_bar(page, "Не удалось найти папку на Google Диске.")
        except Exception as e:
            show_snack_bar(page, f"Ошибка при создании ссылки: {e}")

        current_step += 1
        progress_bar.value = current_step / total_steps
        progress_bar.update()

        # Определяем статус
        selected_status = photo_status_radio_group.value
        if selected_status == "Готово":
            photo_status_id = 1
        elif selected_status == "НТВ":
            photo_status_id = 2
        elif selected_status == "Брак":
            photo_status_id = 25
        else:
            photo_status_id = 1

        if folder_link:
            update_url = f"{API_BASE_URL}/ft/photographer/update-product-status/"
            payload = {
                "STRequestNumber": request_number,
                "barcode": barcode,
                "photo_status": photo_status_id,
                "photos_link": folder_link
            }
            headers = {"Authorization": f"Bearer {token}"}

            try:
                response = requests.post(update_url, json=payload, headers=headers)
                if response.status_code == 200:
                    show_snack_bar(page, "Штрихкод успешно отправлен на бэк!")
                    return_to_requests_page()
                else:
                    show_snack_bar(page, f"Ошибка при обновлении статуса: {response.text}")
            except Exception as e:
                show_snack_bar(page, f"Ошибка подключения к серверу: {e}")

        current_step += 1
        progress_bar.value = current_step / total_steps
        progress_bar.update()
        sleep(0.5)
        progress_bar.visible = False
        page.update()

    progress_bar = ft.ProgressBar(visible=False, width=400)

    barcode_field = ft.TextField(
        label="Введите штрихкод",
        autofocus=True,
        keyboard_type=ft.KeyboardType.NUMBER,
        on_submit=lambda e: validate_barcode(e),
        width=180,
    )

    product_info = ft.Column()
    top_controls = ft.Column(spacing=10)

    content_container.content = ft.Column(
        controls=[
            barcode_field,
            product_info,
            ft.Text("Список новых файлов:"),
            top_controls,
            ft.Row(),  # Пустой ряд, чтобы не было второй кнопки
        ],
        expand=True,
    )
    page.update()

    is_downloading = threading.Event()

    def monitor_new_files():
        """Мониторинг файлов на камере."""
        camera_poll_interval = 5
        processed_camera_files = set()  # Список уже обработанных файлов

        # Инициализация: запоминаем существующие файлы на камере
        print("[INFO] Инициализация мониторинга...")
        initial_files = fetch_files_from_camera_with_retries()
        if initial_files:
            processed_camera_files.update(initial_files)
            print(f"[INFO] Запомнены начальные файлы на камере: {processed_camera_files}")
        else:
            print("[WARNING] Не удалось получить список начальных файлов с камеры.")

        while True:
            try:
                if not start_monitoring.is_set():
                    print("[DEBUG] Мониторинг ещё не запущен. Ждём активации.")
                    sleep(1)
                    continue

                if is_downloading.is_set():
                    print("[INFO] Загрузка в процессе, мониторинг временно остановлен.")
                    sleep(2)
                    continue

                # Проверка файлов на камере
                print("[DEBUG] Проверка файлов на камере...")
                current_camera_files = fetch_files_from_camera_with_retries()
                if current_camera_files is None:
                    print("[ERROR] Ошибка получения файлов с камеры. Пропускаем цикл.")
                    sleep(camera_poll_interval)
                    continue

                # Вычисляем новые файлы
                new_camera_files = current_camera_files - processed_camera_files
                if new_camera_files:
                    print(f"[INFO] Новые файлы на камере: {new_camera_files}")
                    is_downloading.set()  # Ставим флаг загрузки

                    for file_name in new_camera_files:
                        print(f"[DEBUG] Начало загрузки файла с камеры: {file_name}")
                        downloaded_path = download_file_from_camera(file_name)
                        if downloaded_path:
                            print(f"[INFO] Файл {file_name} загружен и сохранён в {downloaded_path}.")
                            # Добавляем в интерфейс
                            all_images.append(os.path.basename(downloaded_path))
                            update_images()
                        sleep(1)

                        # Добавляем новые файлы в список обработанных
                    processed_camera_files.update(new_camera_files)
                    is_downloading.clear()  # Сбрасываем флаг загрузки

                sleep(camera_poll_interval)

            except requests.exceptions.RequestException as req_err:
                print(f"[ERROR] Ошибка подключения к камере: {req_err}")
                sleep(camera_poll_interval * 2)
            except Exception as e:
                print(f"[ERROR] Неизвестная ошибка мониторинга: {e}")

    threading.Thread(target=monitor_new_files, daemon=True).start()

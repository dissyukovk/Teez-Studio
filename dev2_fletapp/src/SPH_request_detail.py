import flet as ft
import requests
import os
from config import API_BASE_URL
from utils import show_snack_bar
from datetime import datetime
from PIL import Image, ExifTags

API_KEY = "AIzaSyBGBcR20R_hQP_yNrfA_L2oWl-0G75BR84"
os.makedirs("./temp", exist_ok=True)

# Фиксированные ширины колонок
COL_WIDTHS = {
    "number": 40,
    "barcode": 150,
    "name": 200,
    "category": 100,
    "reference": 100,
    "comment": 300,
    "photo_status": 150,
    "sphoto_status": 150
}

def build_header_row():
    return ft.Row(
        spacing=0,
        controls=[
            ft.Container(width=COL_WIDTHS["number"], content=ft.Text("№", weight="bold")),
            ft.Container(width=COL_WIDTHS["barcode"], content=ft.Text("Штрихкод", weight="bold")),
            ft.Container(width=COL_WIDTHS["name"], content=ft.Text("Наименование", weight="bold")),
            ft.Container(width=COL_WIDTHS["category"], content=ft.Text("Категория", weight="bold")),
            ft.Container(width=COL_WIDTHS["reference"], content=ft.Text("Референс", weight="bold")),
            ft.Container(width=COL_WIDTHS["comment"], content=ft.Text("Комментарий", weight="bold")),
            ft.Container(width=COL_WIDTHS["photo_status"], content=ft.Text("Статус съемки", weight="bold")),
            ft.Container(width=COL_WIDTHS["sphoto_status"], content=ft.Text("Проверка", weight="bold"))
        ],
        alignment="start"
    )

def build_product_row(number, barcode, name, category, ref_button, comment_field, photo_status_name_text, sphoto_dropdown):
    return ft.Row(
        spacing=0,
        controls=[
            ft.Container(width=COL_WIDTHS["number"], content=ft.Text(str(number))),
            ft.Container(width=COL_WIDTHS["barcode"], content=ft.Text(str(barcode))),
            ft.Container(width=COL_WIDTHS["name"], content=ft.Text(name)),
            ft.Container(width=COL_WIDTHS["category"], content=ft.Text(category)),
            ft.Container(width=COL_WIDTHS["reference"], content=ref_button),
            ft.Container(width=COL_WIDTHS["comment"], content=comment_field),
            ft.Container(width=COL_WIDTHS["photo_status"], content=ft.Text(photo_status_name_text)),
            ft.Container(width=COL_WIDTHS["sphoto_status"], content=sphoto_dropdown),
        ],
        alignment="start"
    )

def sph_request_detail_page(token, page, content_container, user_data, request_number, back_handler):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API_BASE_URL}/ft/sphotographer/request-detail/"
    resp = requests.get(url, headers=headers, params={"request_number": request_number})
    if resp.status_code != 200:
        show_snack_bar(page, "Ошибка загрузки деталей заявки")
        back_handler()
        return

    data = resp.json()

    photographers = get_on_work_photographers(token) or []

    def format_date(d):
        if not d:
            return "-"
        dt = datetime.fromisoformat(d)
        return dt.strftime("%d.%m %H:%M")

    def assign_photographer(user_id):
        assign_url = f"{API_BASE_URL}/ft/sphotographer/assign-request/"
        r = requests.post(assign_url, headers=headers, json={"request_number": request_number, "user_id": user_id})
        if r.status_code == 200:
            show_snack_bar(page, "Фотограф назначен")
        else:
            show_snack_bar(page, "Ошибка назначения фотографа")

    back_button = ft.ElevatedButton("Назад", on_click=lambda e: back_handler())

    # Список фотографов разный, чтобы не было одинаковых имен
    ph_options = []
    photographer_name = data.get("photographer_name", "")
    for ph in photographers:
        ph_options.append(ft.dropdown.Option(key=str(ph["id"]), text=f'{ph["first_name"]} {ph["last_name"]}'))

    photographer_dropdown = ft.Dropdown(
        options=ph_options,
        width=200,
        value=None,
        on_change=lambda e: assign_photographer(e.control.value)
    )

    if photographer_name:
        found = None
        for ph in photographers:
            full_name = f'{ph["first_name"]} {ph["last_name"]}'
            if full_name == photographer_name:
                found = str(ph["id"])
                break
        if found is None:
            photographer_dropdown.options.append(ft.dropdown.Option(key="current_unknown", text=photographer_name))
            photographer_dropdown.value = "current_unknown"
        else:
            photographer_dropdown.value = found

    header = ft.Row(
        spacing=0,
        controls=[
            back_button,
            ft.Text(f"Заявка: {data['RequestNumber']}", size=22, weight="bold"),
            ft.Text(f"Дата создания: {format_date(data['creation_date'])}", size=16),
            ft.Text(f"Дата фото: {format_date(data['photo_date'])}", size=16),
            ft.Text(f"Товаровед: {data['stockman_name']}", size=16),
            ft.Column([ft.Text("Фотограф:", size=16), photographer_dropdown], spacing=0),
            ft.Text(f"Всего товаров: {data['total_products']}", size=16)
        ],
        alignment="spaceBetween"
    )

    products_table = ft.Column(spacing=0)
    table_header = build_header_row()

    sphoto_status_list = get_sphoto_status_list(token, headers)
    sphoto_options = [ft.dropdown.Option(key=str(s['id']), text=s['name']) for s in sphoto_status_list]

    def update_sphoto_status(req_num, barcode, s_id, tile):
        update_url = f"{API_BASE_URL}/ft/sphotographer/update-sphoto-status/"
        r = requests.post(update_url, headers=headers, json={
            "request_number": req_num,
            "barcode": barcode,
            "sphoto_status_id": int(s_id)
        })
        if r.status_code == 200:
            show_snack_bar(page, "Статус проверки обновлен")
            tile.expanded = False
            tile.update()
        else:
            show_snack_bar(page, "Ошибка обновления статуса")

    def extract_exif_data(image_path):
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

    def show_full_screen(image_path):
        exif_info = extract_exif_data(image_path)
        exif_container = ft.Column(
            spacing=5,
            controls=[ft.Text(f"{key}: {value}", size=16) for key, value in exif_info.items()],
        )

        def close_full_screen():
            full_screen_dialog.open = False
            page.dialog = None
            page.update()

        interactive_image_viewer = ft.Container(
            content=ft.InteractiveViewer(
                min_scale=0.1,
                max_scale=5,
                boundary_margin=ft.margin.all(20),
                content=ft.Image(src=image_path, fit="contain", expand=True),
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

        def handle_key_down(e):
            if e.key == "Escape":
                close_full_screen()

        page.on_key_down = handle_key_down

        page.dialog = full_screen_dialog
        full_screen_dialog.open = True
        page.update()

    def show_images(folder_link, images_container):
        images_container.controls.clear()
        folder_link = folder_link or ""
        folder_link = str(folder_link)
        if not folder_link.strip():
            images_container.controls.append(ft.Text("Нет фотографий."))
            images_container.update()
            return

        images_container.controls.append(ft.Text("Загрузка фотографий...", size=16))
        images_container.update()

        folder_id = extract_folder_id_from_link(folder_link)
        if not folder_id:
            images_container.controls.clear()
            images_container.controls.append(ft.Text("Нет фотографий."))
            images_container.update()
            return

        image_paths = get_images_from_google_folder(folder_id)

        images_container.controls.clear()
        if len(image_paths) > 0:
            images_container.controls.append(ft.Text("Фотографии:", size=16, weight="bold"))
            thumbnails = []
            for path in image_paths:
                thumbnails.append(
                    ft.GestureDetector(
                        on_tap=lambda e, p=path: show_full_screen(p),
                        content=ft.Image(src=path, width=90, height=120, fit="contain")
                    )
                )
            images_container.controls.append(ft.Row(controls=thumbnails, wrap=True))
        else:
            images_container.controls.append(ft.Text("Нет фотографий."))
        images_container.update()

    def on_tile_change(e, tile, photos_link, images_container):
        if e.data == "true":
            photos_link = photos_link or ""
            photos_link = str(photos_link)
            if photos_link.strip():
                show_images(photos_link, images_container)
            else:
                images_container.controls.clear()
                images_container.controls.append(ft.Text("Нет фотографий."))
                images_container.update()

    for i, p in enumerate(data["products"], start=1):
        number = i
        barcode = p["barcode"]
        name = p["product_name"]
        category = p["category_name"]
        ref_link = p.get("reference_link", "#") or "#"
        comment = p.get("comment", "")
        photo_status_name = p.get("photo_status_name", "")
        sphoto_status_name = p.get("sphoto_status_name", "")

        comment_field = ft.TextField(value=comment, width=COL_WIDTHS["comment"]-20) # чуть меньше ширины чтобы не вылезало
        sphoto_dropdown = ft.Dropdown(options=get_sphoto_options(sphoto_status_list), width=COL_WIDTHS["sphoto_status"]-20, value=None)

        if sphoto_status_name:
            for s in sphoto_status_list:
                if s["name"] == sphoto_status_name:
                    sphoto_dropdown.value = str(s["id"])
                    break

        ref_button = ft.ElevatedButton("Референс", on_click=lambda e, link=ref_link: page.launch_url(link))
        photos_link = p.get("photos_link", "")
        photos_link = str(photos_link) if photos_link else ""
        images_container = ft.Column(spacing=0)

        if photos_link.strip():
            folder_button = ft.ElevatedButton("Открыть папку с фото", on_click=lambda e, l=photos_link: page.launch_url(l))
            images_container.controls.append(folder_button)

        product_row = build_product_row(number, barcode, name, category, ref_button, comment_field, photo_status_name, sphoto_dropdown)
        tile = ft.ExpansionTile(
            title=product_row,
            controls=[images_container],
            on_change=lambda e, t=None, pl=photos_link, ic=images_container: on_tile_change(e, t, pl, ic)
        )

        sphoto_dropdown.on_change = lambda e, b=barcode, t=tile: update_sphoto_status(request_number, b, e.control.value, tile)
        products_table.controls.append(tile)

    # Обернем products_table в контейнер с фиксированной высотой для гарантированного скролла
    table_container = ft.Container(
        height=600,
        content=ft.Column(spacing=0, controls=[table_header, products_table], scroll="auto")
    )

    content_container.content = ft.Column(
        spacing=0,
        controls=[
            header,
            table_container
        ]
    )
    page.update()

def get_on_work_photographers(token):
    # Возвращаем двух разных фотографов
    return [
        {"id":1,"first_name":"Mike","last_name":"Johnson"},
        {"id":2,"first_name":"Anna","last_name":"Smith"}
    ]

def get_sphoto_status_list(token, headers):
    return [
        {"id":1,"name":"Готово к ретуши"},
        {"id":2,"name":"Нужна повторная съемка"},
    ]

def get_sphoto_options(sphoto_status_list):
    return [ft.dropdown.Option(key=str(s['id']), text=s['name']) for s in sphoto_status_list]

def extract_folder_id_from_link(link):
    link = link or ""
    link = str(link)
    parts = link.strip().split("/")
    if "folders" in parts:
        idx = parts.index("folders")
        if idx+1 < len(parts):
            return parts[idx+1].split("?")[0]
    return ""

def get_images_from_google_folder(folder_id):
    if not folder_id:
        return []
    url = f"https://www.googleapis.com/drive/v3/files?q='{folder_id}'+in+parents&key={API_KEY}&fields=files(id,name,mimeType)&includeItemsFromAllDrives=true&supportsAllDrives=true"
    r = requests.get(url)
    if r.status_code != 200:
        return []
    data = r.json()
    files = data.get("files", [])
    image_files = [f for f in files if f.get("mimeType","").startswith("image/")]

    local_paths = []
    for f in image_files:
        file_id = f["id"]
        download_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media&key={API_KEY}"
        local_path = f"./temp/{file_id}.jpg"
        if download_image(download_url, local_path):
            local_paths.append(local_path)

    return local_paths

def download_image(url, local_path):
    r = requests.get(url)
    if r.status_code == 200:
        with open(local_path, "wb") as f:
            f.write(r.content)
        return True
    return False

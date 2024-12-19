import flet as ft
import requests
from utils import show_snack_bar
from datetime import datetime
from config import API_BASE_URL
from SPH_request_detail import sph_request_detail_page

def sph_on_shoot_page(token, page, content_container, user_data):
    search_field = ft.TextField(label="Поиск", hint_text="Поиск по номеру заявки или штрихкоду")
    page_size_dropdown = ft.Dropdown(
        label="Размер страницы",
        options=[ft.dropdown.Option(str(i)) for i in [5,10,20]],
        value="10"
    )
    sort_field = ft.Dropdown(
        label="Сортировка",
        options=[
            ft.dropdown.Option("photo_date", "По дате фото"),
            ft.dropdown.Option("RequestNumber", "По номеру заявки")
        ],
        value="photo_date"
    )

    current_page = 1
    current_data = []
    total_pages = 1
    photographers = get_on_work_photographers(token)

    def load_data():
        nonlocal current_data, total_pages
        params = {
            "status_id": "3",
            "search": search_field.value or "",
            "page": current_page,
            "page_size": page_size_dropdown.value,
            "ordering": sort_field.value
        }
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{API_BASE_URL}/ft/sphotographer/requests/"
        resp = requests.get(url, headers=headers, params=params)
        if resp.status_code == 200:
            data = resp.json()
            current_data = data.get("results", [])
            total_pages = data.get("total_pages", 1)
        else:
            current_data = []
            total_pages = 1

    def assign_photographer(request_number, photographer_id):
        url = f"{API_BASE_URL}/ft/sphotographer/assign-request/"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "request_number": request_number,
            "user_id": photographer_id
        }
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            show_snack_bar(page, "Фотограф назначен")
            load_data()
            update_table()
        else:
            show_snack_bar(page, "Ошибка назначения фотографа")

    def on_search(e):
        nonlocal current_page
        current_page = 1
        load_data()
        update_table()

    def on_page_size_change(e):
        nonlocal current_page
        current_page = 1
        load_data()
        update_table()

    def on_sort_change(e):
        nonlocal current_page
        current_page = 1
        load_data()
        update_table()

    def next_page(e):
        nonlocal current_page
        if current_page < total_pages:
            current_page += 1
            load_data()
            update_table()

    def prev_page(e):
        nonlocal current_page
        if current_page > 1:
            current_page -= 1
            load_data()
            update_table()

    def format_date(d):
        if not d:
            return "-"
        dt = datetime.fromisoformat(d)
        dt = dt.replace(tzinfo=None)
        return dt.strftime("%d.%m %H:%M")

    def check_time_color(d):
        if not d:
            return ft.Text("-")
        dt = datetime.fromisoformat(d)
        dt = dt.replace(tzinfo=None)
        diff = datetime.now() - dt
        txt = ft.Text(dt.strftime("%d.%m %H:%M"))
        if diff.total_seconds() > 3 * 3600:  # более 3 часов
            txt.color = "red"
        return txt

    def open_detail(request_number):
        sph_request_detail_page(
            token, page, content_container, user_data, request_number,
            back_handler=lambda: sph_on_shoot_page(token, page, content_container, user_data)
        )

    table = ft.DataTable(
        columns=[
            ft.DataColumn(ft.Text("Номер заявки")),
            ft.DataColumn(ft.Text("Дата фото")),
            ft.DataColumn(ft.Text("Фотограф")),
            ft.DataColumn(ft.Text("Всего товаров")),
            ft.DataColumn(ft.Text("Снято")),
            ft.DataColumn(ft.Text("Не проверено")),
        ],
        rows=[],
        expand=True,           # Расширяем таблицу по доступному пространству
        column_spacing=20      # Добавим отступ между столбцами
    )

    paginator_top = ft.Row(
        controls=[
            ft.IconButton(icon=ft.icons.ARROW_BACK, on_click=prev_page),
            ft.Text(f"{current_page}/{total_pages}"),
            ft.IconButton(icon=ft.icons.ARROW_FORWARD, on_click=next_page)
        ],
        alignment="center"
    )

    paginator_bottom = ft.Row(
        controls=[
            ft.IconButton(icon=ft.icons.ARROW_BACK, on_click=prev_page),
            ft.Text(f"{current_page}/{total_pages}"),
            ft.IconButton(icon=ft.icons.ARROW_FORWARD, on_click=next_page)
        ],
        alignment="center"
    )

    def update_table():
        table.rows.clear()
        for req in current_data:
            request_number = req["RequestNumber"]
            photo_date = req["photo_date"]
            taken_count = req["taken_count"]
            unchecked_count = req["unchecked_count"]
            total_products = req["total_products"]
            photographer_name = req["photographer_name"] or ""

            ph_options = []
            for ph in photographers:
                ph_options.append(ft.dropdown.Option(key=str(ph["id"]), text=f'{ph["first_name"]} {ph["last_name"]}'))

            photographer_dropdown = ft.Dropdown(
                options=ph_options,
                width=300,
                value=None,
                on_change=lambda e, rq=request_number: assign_photographer(rq, e.control.value)
            )

            if photographer_name:
                found = None
                for ph in photographers:
                    if f'{ph["first_name"]} {ph["last_name"]}' == photographer_name:
                        found = str(ph["id"])
                        break
                if found is None:
                    photographer_dropdown.options.append(
                        ft.dropdown.Option(key="current_unknown", text=photographer_name)
                    )
                    photographer_dropdown.value = "current_unknown"
                else:
                    photographer_dropdown.value = found

            row = ft.DataRow(
                cells=[
                    ft.DataCell(ft.TextButton(text=request_number, on_click=lambda e, rn=request_number: open_detail(rn))),
                    ft.DataCell(check_time_color(photo_date)),
                    ft.DataCell(photographer_dropdown),
                    ft.DataCell(ft.Text(str(total_products))),
                    ft.DataCell(ft.Text(str(taken_count))),
                    ft.DataCell(ft.Text(str(unchecked_count))),
                ]
            )
            table.rows.append(row)

        paginator_top.controls[1] = ft.Text(f"{current_page}/{total_pages}")
        paginator_bottom.controls[1] = ft.Text(f"{current_page}/{total_pages}")
        paginator_top.update()
        paginator_bottom.update()
        table.update()

    search_field.on_change = on_search
    page_size_dropdown.on_change = on_page_size_change
    sort_field.on_change = on_sort_change

    load_data()

    # Добавляем horizontal_alignment и expand для растяжения по ширине
    content_container.content = ft.Column(
        controls=[
            ft.Row([search_field, page_size_dropdown, sort_field], alignment="spaceBetween"),
            paginator_top,
            table,
            paginator_bottom
        ],
        expand=True,
        spacing=20,
        horizontal_alignment=ft.CrossAxisAlignment.STRETCH  # Растягиваем по ширине
    )
    page.update()

    update_table()

def get_on_work_photographers(token):
    url = f"{API_BASE_URL}/ft/sphotographer/onwork-photographers/"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json()
    return []

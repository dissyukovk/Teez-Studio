import flet as ft
import requests
from utils import show_snack_bar
from datetime import datetime
from config import API_BASE_URL
from SPH_request_detail import sph_request_detail_page
import math

def sph_assign_requests_page(token, page, content_container, user_data):
    # Переменные сортировки
    sort_key = "creation_date"
    sort_ascending = True

    search_field = ft.TextField(
        label="Поиск",
        hint_text="Поиск по номеру заявки или штрихкоду",
        on_submit=lambda e: do_search(),  # Поиск по Enter
        width=300
    )
    page_size_dropdown = ft.Dropdown(
        label="Размер страницы",
        options=[
            ft.dropdown.Option("25", "25"),
            ft.dropdown.Option("50", "50"),
            ft.dropdown.Option("100", "100"),
            ft.dropdown.Option("200", "200")
        ],
        value="50",
        on_change=lambda e: reload_data()
    )

    current_page = 1
    current_data = []
    total_pages = 1
    count = 0
    photographers = get_on_work_photographers(token)

    def build_ordering_param():
        return sort_key if sort_ascending else f"-{sort_key}"

    def load_data():
        nonlocal current_data, total_pages, count
        params = {
            "status_id": "2",
            "search": search_field.value or "",
            "page": current_page,
            "page_size": page_size_dropdown.value,
            "ordering": build_ordering_param()
        }
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{API_BASE_URL}/ft/sphotographer/requests/"
        resp = requests.get(url, headers=headers, params=params)
        if resp.status_code == 200:
            data = resp.json()
            current_data = data.get("results", [])
            count = data.get("count", 0)
            page_size = int(page_size_dropdown.value)
            total_pages_calc = math.ceil(count / page_size) if page_size > 0 else 1
            nonlocal total_pages
            total_pages = total_pages_calc if total_pages_calc > 0 else 1
        else:
            current_data = []
            total_pages = 1
            count = 0

    def do_search():
        nonlocal current_page
        current_page = 1
        load_data()
        update_table()

    def reload_data():
        nonlocal current_page
        current_page = 1
        load_data()
        update_table()

    def assign_photographer(request_number, photographer_id):
        url = f"{API_BASE_URL}/ft/sphotographer/assign-request/"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"request_number": request_number, "user_id": photographer_id}
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            show_snack_bar(page, "Фотограф назначен")
            load_data()
            update_table()
        else:
            show_snack_bar(page, "Ошибка назначения фотографа")

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

    def open_detail(request_number):
        sph_request_detail_page(
            token, page, content_container, user_data, request_number,
            back_handler=lambda: sph_assign_requests_page(token, page, content_container, user_data)
        )

    def toggle_sort(new_key):
        nonlocal sort_key, sort_ascending
        if sort_key == new_key:
            sort_ascending = not sort_ascending
        else:
            sort_key = new_key
            sort_ascending = True
        reload_data()

    number_header = ft.TextButton(text="Номер заявки", on_click=lambda e: toggle_sort("RequestNumber"))
    date_header = ft.TextButton(text="Дата создания", on_click=lambda e: toggle_sort("creation_date"))

    table = ft.DataTable(
        columns=[
            ft.DataColumn(number_header),
            ft.DataColumn(date_header),
            ft.DataColumn(ft.Text("Товаровед")),
            ft.DataColumn(ft.Text("Фотограф")),
            ft.DataColumn(ft.Text("Всего товаров")),
        ],
        rows=[],
        expand=True,
        column_spacing=20,
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

    # Используем Column со scroll='auto' для вертикальной прокрутки таблицы
    # Заворачиваем только таблицу в отдельный Column, чтобы пагинаторы оставались на месте
    scrollable_table = ft.Column(
        controls=[table],
        expand=True,
        scroll="auto"  # вертикальный скролл при необходимости
    )

    def update_table():
        table.rows.clear()
        for req in current_data:
            request_number = req["RequestNumber"]
            date_created = format_date(req["creation_date"])
            stockman = req["stockman_name"] or ""
            photographer_name = req["photographer_name"] or ""
            total_products = req["total_products"]

            ph_options = [
                ft.dropdown.Option(key=str(ph["id"]), text=f'{ph["first_name"]} {ph["last_name"]}')
                for ph in photographers
            ]

            photographer_dropdown = ft.Dropdown(
                options=ph_options,
                width=500,  # еще шире
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
                    ft.DataCell(ft.Text(date_created)),
                    ft.DataCell(ft.Text(stockman)),
                    ft.DataCell(photographer_dropdown),
                    ft.DataCell(ft.Text(str(total_products))),
                ]
            )
            table.rows.append(row)

        paginator_top.controls[1] = ft.Text(f"{current_page}/{total_pages}")
        paginator_bottom.controls[1] = ft.Text(f"{current_page}/{total_pages}")
        paginator_top.update()
        paginator_bottom.update()
        table.update()

    load_data()

    # Теперь структура такая:
    # Row (Поиск, размер страницы)
    # paginator_top
    # scrollable_table (содержащий table)
    # paginator_bottom

    content_container.content = ft.Column(
        controls=[
            ft.Row([search_field, page_size_dropdown], alignment="spaceBetween"),
            paginator_top,
            ft.Column(
                controls=[table],
                expand=True,
                scroll="auto",
                horizontal_alignment=ft.CrossAxisAlignment.STRETCH
            ),
            paginator_bottom
        ],
        expand=True,
        spacing=20,
        horizontal_alignment=ft.CrossAxisAlignment.STRETCH
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

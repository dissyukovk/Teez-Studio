import flet as ft
import requests
from config import API_BASE_URL
from utils import show_snack_bar
from shooting_request import start_shooting
from camera_state import camera_state

def fetch_photographer_requests(token):
    """Получение списка заявок фотографа."""
    url = f"{API_BASE_URL}/ft/photographer-requests/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()["results"]
    else:
        return []

def fetch_request_details(token, request_number):
    """Получение деталей одной заявки."""
    url = f"{API_BASE_URL}/ft/photographer-request/{request_number}/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        return None


def photographer_requests_page(token, page, content_container):
    """Страница текущих заявок фотографа."""
    requests_data = fetch_photographer_requests(token)

    def show_request_details(request_number):
        """Отображение деталей заявки в главном окне."""
        details = fetch_request_details(token, request_number)
        if not details:
            show_snack_bar(page, f"Не удалось загрузить заявку {request_number}")
            return

        # Генерация строк таблицы для товаров
        products_data = details["products"]
        table_rows = []
        for product in products_data:
            table_rows.append(
                ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(product["barcode"])),
                        ft.DataCell(ft.Text(product["name"])),
                        ft.DataCell(ft.Text(product["category"] or "—")),
                        ft.DataCell(
                            ft.TextButton(
                                text="Референс",
                                url=product["reference_link"] if product["reference_link"] else None,
                                disabled=not product["reference_link"],
                            )
                        ),
                        ft.DataCell(ft.Text(product["photo_status"] or "—")),
                        ft.DataCell(ft.Text(product["sphoto_status"] or "—")),
                    ]
                )
            )

        def start_shooting_handler(e):
            """Обработчик начала съемки."""
            if not camera_state.ip:
                show_snack_bar(page, "Сначала подключите камеру")
                return
            # Вызываем функцию начала съемки
            start_shooting(token, request_number, page, content_container)

        # Создание содержимого для отображения деталей заявки
        content = ft.Column(
            controls=[
                ft.Row(
                    controls=[
                        ft.Text(f"Номер заявки: {details['RequestNumber']}", size=20, weight="bold"),
                        ft.Text(f"Статус: {details.get('status', '—')}", size=16),
                        ft.ElevatedButton(
                            text="Начать съемку",
                            on_click=start_shooting_handler,
                            bgcolor="green",
                            color="white",
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                ),
                ft.Divider(),
                # Добавляем контейнер с прокруткой для списка товаров внутри заявки
                ft.Container(
                    content=ft.ListView(
                        controls=[
                            ft.DataTable(
                                columns=[
                                    ft.DataColumn(ft.Text("Штрихкод")),
                                    ft.DataColumn(ft.Text("Наименование")),
                                    ft.DataColumn(ft.Text("Категория")),
                                    ft.DataColumn(ft.Text("Референс")),
                                    ft.DataColumn(ft.Text("Статус съемки")),
                                    ft.DataColumn(ft.Text("Статус старшего фотографа")),
                                ],
                                rows=table_rows,
                                expand=True,
                            )
                        ],
                        expand=True,
                        auto_scroll=False,
                        height=400,  # Устанавливаем высоту прокручиваемого контейнера
                    ),
                    expand=True,
                    height=None,
                    bgcolor=page.theme_mode == ft.ThemeMode.LIGHT and "#EFEFEF" or "#1E1E1E",
                    padding=ft.padding.all(10),
                    border_radius=ft.border_radius.all(8),
                ),
            ],
            expand=True,
        )

        content_container.content = content
        page.update()

    def create_requests_list():
        """Создаёт список заявок."""
        table_rows = []
        for request in requests_data:
            table_rows.append(
                ft.DataRow(
                    cells=[
                        ft.DataCell(
                            ft.TextButton(
                                text=request["RequestNumber"],
                                on_click=lambda e, rn=request["RequestNumber"]: show_request_details(rn),
                            )
                        ),
                        ft.DataCell(ft.Text(f'{request["shooted_count"]}/{request["total_products"]}')),
                        ft.DataCell(ft.Text(request["correct_count"])),
                        ft.DataCell(ft.Text(request["incorrect_count"])),
                    ]
                )
            )

        return ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("Номер заявки")),
                ft.DataColumn(ft.Text("Снято/Общее")),
                ft.DataColumn(ft.Text("Проверено")),
                ft.DataColumn(ft.Text("Правки")),
            ],
            rows=table_rows,
            expand=True,
        )

    content_container.content = create_requests_list()
    page.update()


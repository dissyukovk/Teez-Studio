from django.shortcuts import render, redirect, get_object_or_404
from .models import STRequest, Product, Invoice, ProductMoveStatus, ProductCategory, Product, Order, OrderProduct, OrderStatus, STRequestProduct, ProductOperation, ProductOperationTypes, InvoiceProduct, RetouchStatus, STRequestStatus
from .forms import STRequestForm
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets, status, serializers, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User, Group
from django.views.decorators.csrf import csrf_exempt
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import UserSerializer, ProductSerializer, STRequestSerializer, InvoiceSerializer, StatusSerializer, ProductOperationSerializer, OrderSerializer, RetouchStatusSerializer, STRequestStatusSerializer, OrderStatusSerializer
from django.db import transaction, IntegrityError
from django.db.models import Count, Max
from django.utils import timezone
import logging

# Настраиваем логирование
logger = logging.getLogger(__name__)

# Пагинация
class ProductPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductHistoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# CRUD для пользователей (User) с фильтрацией и сортировкой
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['id', 'first_name', 'last_name', 'email', 'groups__name']
    ordering_fields = ['id', 'first_name', 'last_name', 'email']

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = {
            'id': user.id,  # Add the user's ID here
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'groups': [group.name for group in user.groups.all()]
        }
        return Response(user_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_products(request):
    barcodes = request.data.get('barcodes', [])
    user_id = request.data.get('userId')
    status_id = request.data.get('status')
    date = request.data.get('date', timezone.now())

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    for barcode in barcodes:
        try:
            product = Product.objects.get(barcode=barcode)
            product.move_status_id = status_id  # Присваиваем новый статус
            product.income_stockman_id = user_id  # Записываем товароведа приемки
            product.income_date = date  # Записываем дату приемки
            product.save()

            # Логируем операцию
            ProductOperation.objects.create(
                product=product,
                operation_type_id=3,  # Тип операции "income"
                user=user,
                date=date
            )
        except Product.DoesNotExist:
            continue

    return Response({'message': 'Products accepted successfully'}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_products(request):
    barcodes = request.data.get('barcodes', [])
    user_id = request.data.get('userId')
    status_id = request.data.get('status')
    date = request.data.get('date', timezone.now())

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    for barcode in barcodes:
        try:
            product = Product.objects.get(barcode=barcode)
            product.move_status_id = status_id  # Присваиваем новый статус
            product.outcome_stockman_id = user_id  # Записываем товароведа отправки
            product.outcome_date = date  # Записываем дату отправки
            product.save()

            # Логируем операцию
            ProductOperation.objects.create(
                product=product,
                operation_type_id=4,  # Тип операции "outcome"
                user=user,
                date=date
            )
        except Product.DoesNotExist:
            continue

    return Response({'message': 'Products sent successfully'}, status=200)


def generate_next_request_number():
    with transaction.atomic():
        last_request = STRequest.objects.select_for_update().order_by('-RequestNumber').first()
        if last_request:
            # Увеличиваем числовую часть номера
            next_number = str(int(last_request.RequestNumber) + 1).zfill(13)
        else:
            next_number = "2000000000001"
        return next_number

# Проверка наличия штрихкода
@api_view(['GET'])
def check_barcode(request, barcode):
    try:
        product = Product.objects.get(barcode=barcode)
        return Response({'exists': True}, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product_operation(request):
    user = request.user
    barcodes = request.data.get('barcodes', [])
    operation_id = request.data.get('operation', '')
    comment = request.data.get('comment', '')  # Получаем комментарий из запроса

    # Находим тип операции
    operation_type = ProductOperationTypes.objects.filter(id=operation_id).first()
    if not operation_type:
        return Response({'error': 'Invalid operation type'}, status=400)

    for barcode in barcodes:
        product = Product.objects.filter(barcode=barcode).first()
        if product:
            ProductOperation.objects.create(
                product=product,
                operation_type=operation_type,  # Передаем объект типа операции
                user=user,
                date=timezone.now(),
                comment=comment  # Сохраняем комментарий
            )

    return Response({'message': 'Операция успешно добавлена в историю'})

# Получение информации о заказе по штрихкоду
@api_view(['GET'])
def get_order_for_barcode(request, barcode):
    try:
        # Найдем продукт по штрихкоду
        product = Product.objects.filter(barcode=barcode).first()

        if product:
            # Ищем заказ через связь OrderProduct
            order_product = OrderProduct.objects.filter(product=product).first()
            
            if order_product:
                order = order_product.order  # Получаем заказ, связанный с продуктом
                order_data = {
                    "orderNumber": order.OrderNumber,
                    "isComplete": order_product.order.status_id in [8, 9]  # Проверяем статус заказа
                }
                return Response(order_data, status=status.HTTP_200_OK)
            else:
                return Response({"orderNumber": "Нет заказа"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Штрихкод не найден"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# CRUD для STRequest
class STRequestViewSet(viewsets.ModelViewSet):
    queryset = STRequest.objects.all()
    serializer_class = STRequestSerializer


# CRUD для Invoice
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer


# Функция для вывода пользователей с фильтрацией и пагинацией
@api_view(['GET'])
def user_list(request):
    users = User.objects.all()

    # Фильтрация по полям
    first_name = request.query_params.get('first_name', None)
    last_name = request.query_params.get('last_name', None)
    group = request.query_params.get('group', None)

    if first_name:
        users = users.filter(first_name__icontains=first_name)
    if last_name:
        users = users.filter(last_name__icontains=last_name)
    if group:
        users = users.filter(groups__name__icontains=group)

    # Сортировка
    sort_field = request.query_params.get('sort_field', None)
    sort_order = request.query_params.get('sort_order', 'asc')

    if sort_field:
        if sort_order == 'desc':
            sort_field = f'-{sort_field}'
        users = users.order_by(sort_field)

    # Пагинация
    paginator = ProductPagination()
    paginated_users = paginator.paginate_queryset(users, request)
    serializer = UserSerializer(paginated_users, many=True)
    return paginator.get_paginated_response(serializer.data)


# Фильтрация для Product
@api_view(['GET'])
def product_list(request):
    products = Product.objects.select_related('category', 'move_status').all()

    # Get filtering parameters
    barcode = request.query_params.get('barcode', None)
    name = request.query_params.get('name', None)
    category = request.query_params.get('category', None)
    move_status_id = request.query_params.get('move_status_id', None)
    move_status_ids = request.query_params.getlist('move_status_id__in')

    # Filter out empty strings from move_status_ids
    move_status_ids = [int(status_id) for status_id in move_status_ids if status_id]

    # Apply filters
    if move_status_ids:
        products = products.filter(move_status_id__in=move_status_ids)
    elif move_status_id:
        products = products.filter(move_status_id=move_status_id)

    if barcode:
        products = products.filter(barcode__icontains=barcode)
    if name:
        products = products.filter(name__icontains=name)
    if category:
        products = products.filter(category__name__icontains=category)

    # Sorting
    sort_field = request.query_params.get('sort_field', None)
    sort_order = request.query_params.get('sort_order', 'asc')

    if sort_field:
        if sort_order == 'desc':
            sort_field = f'-{sort_field}'
        products = products.order_by(sort_field)

    # Pagination
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(paginated_products, many=True)
    return paginator.get_paginated_response(serializer.data)


# Фильтрация для STRequest
@api_view(['GET'])
def strequest_list(request):
    strequests = STRequest.objects.select_related('stockman', 'status').all()  # Предзагрузка stockman и status
    
    # Фильтрация по статусу
    status = request.query_params.get('status', None)
    if status:
        strequests = strequests.filter(status__id=status)

    # Фильтрация по фотографу
    photographer_id = request.query_params.get('photographer', None)
    if photographer_id:
        strequests = strequests.filter(photographer_id=photographer_id)
    
    # Фильтрация по ретушеру
    retoucher_id = request.query_params.get('retoucher', None)
    if retoucher_id:
        strequests = strequests.filter(retoucher_id=retoucher_id)
    
    # Дополнительные фильтры
    RequestNumber = request.query_params.get('RequestNumber', None)
    stockman = request.query_params.get('stockman', None)
    barcode = request.query_params.get('barcode', None)

    if RequestNumber:
        strequests = strequests.filter(RequestNumber__icontains=RequestNumber)
    if stockman:
        strequests = strequests.filter(stockman__username__icontains=stockman)
    if barcode:
        strequests = strequests.filter(strequestproduct__product__barcode__icontains=barcode)

    # Сортировка
    sort_field = request.query_params.get('sort_field', 'RequestNumber')
    sort_order = request.query_params.get('sort_order', 'asc')

    if sort_field:
        if sort_order == 'desc':
            sort_field = f'-{sort_field}'
        strequests = strequests.order_by(sort_field)

    paginator = ProductPagination()
    paginated_strequests = paginator.paginate_queryset(strequests, request)
    serializer = STRequestSerializer(paginated_strequests, many=True)
    return paginator.get_paginated_response(serializer.data)


# Фильтрация для Invoice с пагинацией и фильтрацией по штрихкоду товара
@api_view(['GET'])
def invoice_list(request):
    invoices = Invoice.objects.all()

    # Фильтрация по полям
    invoice_number = request.query_params.get('invoice_number', None)
    barcode = request.query_params.get('barcode', None)

    if invoice_number:
        invoices = invoices.filter(InvoiceNumber__icontains=invoice_number)
    if barcode:
        # Фильтрация по продуктам, связанным с накладными
        invoices = invoices.filter(invoiceproduct__product__barcode__icontains=barcode)

    # Сортировка
    sort_field = request.query_params.get('sort_field', None)
    sort_order = request.query_params.get('sort_order', 'asc')

    if sort_field:
        if sort_order == 'desc':
            sort_field = f'-{sort_field}'
        invoices = invoices.order_by(sort_field)

    paginator = ProductPagination()
    paginated_invoices = paginator.paginate_queryset(invoices, request)
    serializer = InvoiceSerializer(paginated_invoices, many=True)
    return paginator.get_paginated_response(serializer.data)

# Фильтрация для Invoice с пагинацией
class InvoiceListView(ListAPIView):
    queryset = Invoice.objects.all().order_by('id')
    serializer_class = InvoiceSerializer
    pagination_class = ProductPagination

    def filter_queryset(self, queryset):
        invoice_number = self.request.query_params.get('invoice_number', None)
        creator = self.request.query_params.get('creator', None)
        date = self.request.query_params.get('date', None)

        if invoice_number:
            queryset = queryset.filter(InvoiceNumber__icontains=invoice_number)
        if creator:
            queryset = queryset.filter(creator__username__icontains=creator)
        if date:
            queryset = queryset.filter(date__date=date)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Bulk Upload Products
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_upload_products(request):
    data = request.data.get('data', [])

    for row in data:
        try:
            barcode = row['barcode']
            name = row['name']
            category_id = row['category_id']
            seller = row['seller']
            in_stock_sum = row['in_stock_sum']
            cell = row['cell']

            product, created = Product.objects.get_or_create(
                barcode=barcode,
                defaults={
                    'name': name,
                    'category_id': category_id,
                    'seller': seller,
                    'in_stock_sum': in_stock_sum,
                    'cell': cell,
                }
            )
            if not created:
                product.name = name
                product.category_id = category_id
                product.seller = seller
                product.in_stock_sum = in_stock_sum
                product.cell = cell
                product.save()

        except Exception as e:
            return Response({'error': str(e)}, status=400)

    return Response({'message': 'Данные успешно внесены!'}, status=200)


# Отображение статусов
class StatusesListView(APIView):
    def get(self, request):
        statuses = ProductMoveStatus.objects.all()
        serializer = StatusSerializer(statuses, many=True)
        return Response(serializer.data)


# Получение списка заявок в зависимости от роли (оставим без изменений)
@login_required
def get_requests(request):
    user = request.user
    if user.groups.filter(name='товаровед').exists() or user.groups.filter(name='менеджер').exists():
        requests = STRequest.objects.all()
    elif user.groups.filter(name='старший фотограф').exists():
        requests = STRequest.objects.filter(status__name__in=['Создана', 'на съемке', 'на проверке'])
    elif user.groups.filter(name='фотограф').exists():
        requests = STRequest.objects.filter(photographer=user, status__name='на съемке')
    elif user.groups.filter(name='старший ретушер').exists():
        requests = STRequest.objects.filter(status__name__in=['Отснято', 'на ретуши', 'на проверке ретуши'])
    elif user.groups.filter(name='ретушер').exists():
        requests = STRequest.objects.filter(retoucher=user, status__name='на ретуши')
    return render(request, 'core/requests_list.html', {'requests': requests})


# Создание и редактирование заявок (оставим без изменений)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_request(request):
    barcodes = request.data.get('barcodes', [])
    user = request.user

    # Получаем последнюю заявку
    last_request = STRequest.objects.order_by('id').last()
    
    # Генерируем новый номер заявки
    if last_request:
        last_request_number = int(last_request.RequestNumber)
        new_request_number = str(last_request_number + 1).zfill(13)
    else:
        new_request_number = "2000000000001"

    # Создаем новую заявку
    new_request = STRequest.objects.create(
        RequestNumber=new_request_number,
        creation_date=timezone.now(),
        stockman=user,
        status_id=2
    )

    # Связываем товары с заявкой
    for barcode in barcodes:  # Ожидаем, что `barcodes` содержит список строк
        product = Product.objects.filter(barcode=barcode).first()
        if product:
            STRequestProduct.objects.create(request=new_request, product=product)

    # Возвращаем ответ с созданной заявкой
    return Response({'status': 'Заявка создана', 'requestNumber': new_request_number})

@login_required
def update_request(request, pk):
    st_request = get_object_or_404(STRequest, pk=pk)
    if request.method == 'POST':
        form = STRequestForm(request.POST, instance=st_request)
        if form.is_valid():
            form.save()
            return redirect('requests_list')
    else:
        form = STRequestForm(instance=st_request)
    return render(request, 'core/update_request.html', {'form': form})

# View для просмотра с фильтрацией и пагинацией
class ProductOperationListView(ListAPIView):
    queryset = ProductOperation.objects.all()
    serializer_class = ProductOperationSerializer
    pagination_class = ProductPagination

    # Фильтрация по штрихкоду, дате, пользователю и операции
    def get_queryset(self):
        queryset = super().get_queryset()
        barcode = self.request.query_params.get('barcode', None)
        operation = self.request.query_params.get('operation', None)
        user_id = self.request.query_params.get('user', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)

        if barcode:
            queryset = queryset.filter(product__barcode=barcode)
        if operation:
            queryset = queryset.filter(operation=operation)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if date_from and date_to:
            queryset = queryset.filter(date__range=[date_from, date_to])
        elif date_from:
            queryset = queryset.filter(date__gte=date_from)
        elif date_to:
            queryset = queryset.filter(date__lte=date_to)

        return queryset

# ViewSet для CRUD операций (создание, чтение, обновление, удаление)
class ProductOperationCRUDViewSet(viewsets.ModelViewSet):
    queryset = ProductOperation.objects.all()
    serializer_class = ProductOperationSerializer

class OrderListView(ListAPIView):
    queryset = Order.objects.all().select_related('creator', 'status').annotate(
        total_products=Count('orderproduct')  # Обратная связь через orderproduct
    )
    serializer_class = OrderSerializer
    pagination_class = OrderPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['OrderNumber', 'creator__username', 'status']
    ordering_fields = ['OrderNumber', 'date', 'status', 'creator__username']
    ordering = ['date']

class RetouchStatusListView(APIView):
    permission_classes = [IsAuthenticated]  # Ограничиваем доступ только для авторизованных пользователей

    def get(self, request):
        retouch_statuses = RetouchStatus.objects.all()
        serializer = RetouchStatusSerializer(retouch_statuses, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def get_last_request(request, barcode):
    try:
        # Находим продукт по штрихкоду
        product = Product.objects.get(barcode=barcode)
        
        # Используем связанный объект 'strequestproduct' для поиска последней заявки по продукту
        last_request = STRequest.objects.filter(strequestproduct__product=product).order_by('-creation_date').first()

        if last_request:
            status_id = last_request.status.id
            status_name = last_request.status.name  # Получаем название статуса
            
            return Response({
                'requestNumber': last_request.RequestNumber,
                'statusName': status_name  # Возвращаем название статуса
            })
        else:
            # Если заявок с продуктом нет
            return Response({
                'requestNumber': None,
                'statusName': 'Нет заявок'
            }, status=200)
        
    except Product.DoesNotExist:
        return Response({'error': 'Продукт не найден'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_product_statuses(request):
    barcodes = request.data.get('barcodes', [])
    status_id = request.data.get('status', None)  # Числовое значение статуса
    user_id = request.data.get('userId', None)    # Числовое значение ID пользователя
    date = request.data.get('date', timezone.now())  # Дата, если не передана

    if not all([barcodes, status_id, user_id]):
        return Response({'error': 'Missing required fields'}, status=400)

    # Получаем пользователя
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    # Обрабатываем каждый штрихкод
    for barcode in barcodes:
        try:
            product = Product.objects.get(barcode=barcode)
            product.move_status_id = status_id
            product.income_stockman_id = user_id if status_id == 3 else None  # Если приемка, записываем товароведа приемки
            product.outcome_stockman_id = user_id if status_id == 4 else None  # Если отправка, записываем товароведа отправки
            product.income_date = date if status_id == 3 else None
            product.outcome_date = date if status_id == 4 else None
            product.save()
        except Product.DoesNotExist:
            continue  # Пропускаем штрихкоды, если продукт не найден

    return Response({'message': 'Product statuses updated successfully'}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invoice(request):
    barcodes = request.data.get('barcodes', [])
    creator = request.user  # Получаем текущего пользователя
    date = request.data.get('date', timezone.now())

    # Получаем максимальный номер накладной и увеличиваем его на 1
    max_invoice_number = Invoice.objects.aggregate(Max('InvoiceNumber'))['InvoiceNumber__max']
    new_invoice_number = str(int(max_invoice_number) + 1).zfill(13) if max_invoice_number else '0000000000001'

    # Создаем новую накладную с уникальным номером
    new_invoice = Invoice.objects.create(
        InvoiceNumber=new_invoice_number,
        date=date,
        creator=creator
    )

    # Добавляем товары в накладную
    for barcode in barcodes:
        try:
            product = Product.objects.get(barcode=barcode)
            InvoiceProduct.objects.create(invoice=new_invoice, product=product)
        except Product.DoesNotExist:
            continue

    return Response({'invoiceNumber': new_invoice.InvoiceNumber, 'status': 'Накладная создана'}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_defective(request):
    barcode = request.data.get('barcode')
    comment = request.data.get('comment', '')
    user = request.user

    try:
        product = Product.objects.get(barcode=barcode)
        product.move_status_id = 25  # Статус "брак"
        product.save()

        # Логирование операции
        ProductOperation.objects.create(
            product=product,
            operation_type_id=25,  # ID операции "брак"
            user=user,
            comment=comment
        )
        return Response({'message': 'Товар помечен как брак'}, status=200)
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_product_by_barcode(request, barcode):
    try:
        product = Product.objects.get(barcode=barcode)
        # Ищем последнюю активную заявку на продукт
        last_request = STRequest.objects.filter(strequestproduct__product=product).order_by('-creation_date').first()

        # Если заявка найдена, получаем номер заявки и статус
        if last_request:
            last_request_data = {
                'request_number': last_request.RequestNumber,
                'request_status': last_request.status.name
            }
        else:
            # Если заявок нет, возвращаем сообщение
            last_request_data = {
                'request_number': None,
                'request_status': 'Нет заявок'
            }

        # Серилизуем продукт
        product_data = ProductSerializer(product).data
        product_data['last_request'] = last_request_data  # Добавляем данные о последней заявке

        return Response(product_data)

    except Product.DoesNotExist:
        return Response({'error': 'Продукт не найден'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_defect_operation(request):
    barcode = request.data.get('barcode', None)
    user_id = request.data.get('userId', None)
    comment = request.data.get('comment', '')

    if not barcode or not user_id:
        return Response({'error': 'Barcode and userId are required'}, status=400)

    # Получаем пользователя
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    # Получаем продукт
    try:
        product = Product.objects.get(barcode=barcode)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    # Обновляем статус продукта на "брак" (25)
    product.move_status_id = 25
    product.save()

    # Получаем тип операции (25 - "брак")
    defect_operation_type = ProductOperationTypes.objects.get(id=25)

    # Логируем операцию с комментарием
    ProductOperation.objects.create(
        product=product,
        operation_type=defect_operation_type,
        user=user,
        comment=comment,  # Сохраняем комментарий
        date=timezone.now()
    )

    return Response({'message': 'Product marked as defective, status updated, and logged successfully'}, status=200)

@api_view(['POST'])
def create_draft_request(request):
    user = request.user
    try:
        with transaction.atomic():
            # Генерируем новый номер заявки
            request_number = generate_next_request_number()

            # Проверяем, существует ли уже такая заявка
            if STRequest.objects.filter(RequestNumber=request_number).exists():
                raise IntegrityError(f"Request number {request_number} already exists.")
            
            # Создаем новую заявку
            new_request = STRequest.objects.create(
                RequestNumber=request_number,
                stockman=user,
                creation_date=timezone.now(),
                status_id=1  # Статус черновика
            )
        return Response({'requestNumber': new_request.RequestNumber}, status=200)
    
    except IntegrityError as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
def finalize_request(request):
    # Финализация заявки: привязываем штрихкоды и переводим статус в 2
    request_number = request.data.get('requestNumber')
    barcodes = request.data.get('barcodes', [])

    st_request = STRequest.objects.filter(RequestNumber=request_number).first()
    if not st_request:
        return Response({'error': 'Заявка не найдена'}, status=404)

    for barcode in barcodes:
        product = Product.objects.filter(barcode=barcode).first()
        if product:
            STRequestProduct.objects.create(request=st_request, product=product)

    st_request.status_id = 2  # Переводим заявку в статус 2
    st_request.save()

    return Response({'message': 'Заявка успешно завершена'})


# Фильтрация для Order
@api_view(['GET'])
def order_list(request):
    orders = Order.objects.all()

    # Фильтрация по номеру заказа
    order_number = request.query_params.get('OrderNumber', None)
    if order_number:
        orders = orders.filter(OrderNumber__icontains=order_number)

    # Фильтрация по штрихкоду товара
    barcode = request.query_params.get('barcode', None)
    if barcode:
        orders = orders.filter(orderproduct__product__barcode__icontains=barcode)

    # Фильтрация по статусу
    status_id = request.query_params.get('status', None)
    if status_id:
        orders = orders.filter(status_id=status_id)

    # Фильтрация по дате заказа
    date_from = request.query_params.get('date_from', None)
    date_to = request.query_params.get('date_to', None)
    if date_from and date_to:
        orders = orders.filter(date__range=[date_from, date_to])
    elif date_from:
        orders = orders.filter(date__gte=date_from)
    elif date_to:
        orders = orders.filter(date__lte=date_to)

    # Сортировка
    sort_field = request.query_params.get('sort_field', 'OrderNumber')
    sort_order = request.query_params.get('sort_order', 'asc')

    if sort_field:
        if sort_order == 'desc':
            sort_field = f'-{sort_field}'
        orders = orders.order_by(sort_field)

    # Пагинация
    paginator = ProductPagination()
    paginated_orders = paginator.paginate_queryset(orders, request)

    # Вычисление количества товаров в заказе
    for order in paginated_orders:
        order.total_products = OrderProduct.objects.filter(order=order).count()

    # Сериализация
    serializer = OrderSerializer(paginated_orders, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
def request_details(request, request_number):
    try:
        strequest = STRequest.objects.get(RequestNumber=request_number)
        barcodes = strequest.strequestproduct_set.all()
        
        # Добавляем категорию и ссылку на категорию в данные штрихкодов
        barcodes_data = [
            {
                'barcode': bp.product.barcode,
                'name': bp.product.name,
                'movementStatus': bp.product.move_status.name if bp.product.move_status else 'N/A',  # Проверка на None
                'category_name': bp.product.category.name if bp.product.category else 'N/A',  # Проверяем наличие категории
                'category_reference_link': bp.product.category.reference_link if bp.product.category else 'N/A',  # Проверяем наличие ссылки
                'retouch_status_name': bp.retouch_status.name if bp.retouch_status else 'N/A',  # Статус ретуши из strequestproduct
                'retouch_link': bp.product.retouch_link if bp.product.retouch_link else 'N/A'  # Ссылка на обработанные фото из Product
            }
            for bp in barcodes
        ]
        
        # Добавляем данные о фотографе
        photographer_first_name = strequest.photographer.first_name if strequest.photographer else "Не назначен"
        photographer_last_name = strequest.photographer.last_name if strequest.photographer else ""
        photographer_id = strequest.photographer.id if strequest.photographer else None

        # Добавляем данные о ретушере
        retoucher_first_name = strequest.retoucher.first_name if strequest.retoucher else "Не назначен"
        retoucher_last_name = strequest.retoucher.last_name if strequest.retoucher else ""
        retoucher_id = strequest.retoucher.id if strequest.retoucher else None
        
        return Response({
            'barcodes': barcodes_data,
            'status': strequest.status.name,
            'photographer_first_name': photographer_first_name,
            'photographer_last_name': photographer_last_name,
            'photographer_id': photographer_id,
            'retoucher_first_name': retoucher_first_name,  # Имя ретушера
            'retoucher_last_name': retoucher_last_name,    # Фамилия ретушера
            'retoucher_id': retoucher_id,                  # ID ретушера
            'comment': strequest.s_ph_comment,
            's_ph_comment': strequest.s_ph_comment,  # Комментарий фотографа
            'sr_comment': strequest.sr_comment,      # Комментарий ретушера
            'photos_link': strequest.photos_link
        })
    except STRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=404)

@api_view(['GET'])
def barcode_details(request, barcode):
    try:
        product = Product.objects.get(barcode=barcode)
        return Response({'exists': True, 'name': product.name, 'movementStatus': product.move_status.name})
    except Product.DoesNotExist:
        return Response({'exists': False}, status=404)

@api_view(['POST'])
def update_request(request, request_number):
    added_barcodes = request.data.get('addedBarcodes', [])
    removed_barcodes = request.data.get('removedBarcodes', [])

    logger.info(f'Request data: {request.data}')  # Логируем данные, которые приходят с фронта

    try:
        strequest = STRequest.objects.get(RequestNumber=request_number)

        # Логируем штрихкоды для добавления и удаления
        logger.info(f'Добавляем штрихкоды: {added_barcodes}')
        logger.info(f'Удаляем штрихкоды: {removed_barcodes}')

        if removed_barcodes:
            for barcode in removed_barcodes:
                STRequestProduct.objects.filter(request=strequest, product__barcode=barcode).delete()

        if added_barcodes:
            for barcode in added_barcodes:
                product = Product.objects.get(barcode=barcode)
                STRequestProduct.objects.create(request=strequest, product=product)

        return Response({'message': 'Request updated successfully'})

    except STRequest.DoesNotExist:
        logger.error(f'Заявка с номером {request_number} не найдена')
        return Response({'error': 'Request not found'}, status=404)
    except Product.DoesNotExist:
        logger.error('Продукт с указанным штрихкодом не найден')
        return Response({'error': 'Product not found'}, status=404)

@api_view(['POST'])
def update_request_status(request, request_number):
    try:
        strequest = STRequest.objects.get(RequestNumber=request_number)
        
        # Обновляем статус заявки, если он передан
        status = request.data.get('status')
        if status:
            strequest.status_id = status
        
        # Обновляем photos_link только если он передан в запросе
        photos_link = request.data.get('photos_link')
        if photos_link:
            strequest.photos_link = photos_link
        
        strequest.save()
        
        return Response({'message': 'Статус и ссылка обновлены (если переданы)'}, status=200)
    except STRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_photographers(request):
    try:
        # Ищем группу "Фотограф"
        photographers_group = Group.objects.get(name="Фотограф")
        # Получаем всех пользователей, принадлежащих этой группе
        photographers = User.objects.filter(groups=photographers_group)
        
        # Формируем список фотографов для ответа
        photographers_data = [
            {
                'id': photographer.id,
                'first_name': photographer.first_name,
                'last_name': photographer.last_name,
                'email': photographer.email
            }
            for photographer in photographers
        ]
        
        return Response(photographers_data, status=200)

    except Group.DoesNotExist:
        return Response({'error': 'Группа "Фотограф" не найдена'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_photographer(request, request_number):
    try:
        # Получаем заявку по номеру
        st_request = STRequest.objects.get(RequestNumber=request_number)
        
        # Получаем ID фотографа и комментарий из тела запроса
        photographer_id = request.data.get('photographer_id')
        comment = request.data.get('comment')  # Получаем комментарий

        if not photographer_id:
            return Response({'error': 'Не указан фотограф'}, status=400)
        
        # Проверяем, существует ли фотограф
        photographer = User.objects.filter(id=photographer_id).first()
        if not photographer:
            return Response({'error': 'Фотограф не найден'}, status=404)

        # Назначаем фотографа для заявки, сохраняем комментарий и обновляем статус
        st_request.photographer = photographer
        st_request.s_ph_comment = comment  # Сохраняем комментарий
        st_request.status_id = 3  # Обновляем статус заявки
        st_request.photo_date = timezone.now()  # Устанавливаем текущую дату и время в photo_date
        st_request.save()

        # Логируем операцию в таблицу ProductOperation
        # Допустим, у нас есть операция с типом 5 для назначения фотографа
        for st_request_product in st_request.strequestproduct_set.all():
            ProductOperation.objects.create(
                product=st_request_product.product,
                operation_type_id=5,  # ID типа операции для назначения фотографа
                user=photographer
            )
        
        return Response({'message': 'Фотограф успешно назначен и комментарий сохранен'}, status=200)
    
    except STRequest.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_retouchers(request):
    try:
        retouchers = User.objects.filter(groups__name='Ретушер', is_active=True)
        serializer = UserSerializer(retouchers, many=True)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_retoucher(request, request_number):
    try:
        retoucher_id = request.data.get('retoucher_id')
        comment = request.data.get('sr_comment')  # Получаем комментарий из запроса

        if not retoucher_id:
            return Response({'error': 'Не указан ретушер'}, status=400)

        st_request = STRequest.objects.get(RequestNumber=request_number)
        retoucher = User.objects.filter(id=retoucher_id).first()

        if not retoucher:
            return Response({'error': 'Ретушер не найден'}, status=404)

        # Назначаем ретушера и обновляем статус
        st_request.retoucher = retoucher
        st_request.status_id = 6  # Устанавливаем статус на "Ретушь"
        st_request.retouch_date = timezone.now()  # Устанавливаем текущую дату и время в retouch_date

        # Записываем комментарий, если он был передан
        if comment:
            st_request.sr_comment = comment

        st_request.save()

        return Response({'message': 'Ретушер успешно назначен'}, status=200)
    except STRequest.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_retouch_statuses_and_links(request, request_number):
    try:
        strequest = STRequest.objects.get(RequestNumber=request_number)

        # Получаем список баркодов с данными о статусе ретуши и ссылке
        barcodes = request.data.get('barcodes', [])

        for barcode_data in barcodes:
            barcode_value = barcode_data.get('barcode')
            retouch_status_id = barcode_data.get('retouch_status')
            retouch_link = barcode_data.get('retouch_link')

            # Находим продукт по штрихкоду в рамках текущей заявки
            try:
                strequest_product = STRequestProduct.objects.get(
                    request=strequest, product__barcode=barcode_value
                )
                
                # Обновляем статус ретуши и ссылку
                strequest_product.retouch_status_id = retouch_status_id
                strequest_product.product.retouch_link = retouch_link
                strequest_product.product.save()  # Сохраняем изменения продукта
                strequest_product.save()  # Сохраняем изменения для связи

            except STRequestProduct.DoesNotExist:
                continue  # Пропускаем, если продукт с баркодом не найден

        # Переводим заявку в статус 7 (Готово к проверке)
        strequest.status_id = 7
        strequest.save()

        return Response({'message': 'Статусы ретуши, ссылки и статус заявки обновлены'}, status=200)
    except STRequest.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_request_statuses(request):
    try:
        print("Fetching request statuses...")
        statuses = STRequestStatus.objects.all()
        print(f"Statuses retrieved: {[str(status) for status in statuses]}")  # Проверяем данные в статусах
        serializer = STRequestStatusSerializer(statuses, many=True)
        print(f"Serialized data: {serializer.data}")  # Проверяем сериализованные данные
        return Response(serializer.data)
    except Exception as e:
        print(f"Error fetching request statuses: {e}")
        return Response({"error": "Failed to fetch request statuses"}, status=500)

@api_view(['GET'])
def search_orders_by_barcode(request):
    barcode = request.query_params.get('barcode', None)
    if not barcode:
        return Response({"error": "Barcode is required"}, status=400)

    # Find orders containing the specified barcode
    orders = Order.objects.filter(orderproduct__product__barcode__icontains=barcode).distinct()
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

class OrderStatusListView(APIView):
    def get(self, request):
        statuses = OrderStatus.objects.all()
        serializer = OrderStatusSerializer(statuses, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def get_order_statuses(request):
    statuses = OrderStatus.objects.all()
    serializer = OrderStatusSerializer(statuses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def order_details(request, orderNumber):
    try:
        # Получаем заказ по номеру
        order = Order.objects.get(OrderNumber=orderNumber)
        
        # Получаем продукты, связанные с заказом
        order_products = OrderProduct.objects.filter(order=order).select_related('product')
        products_data = [
            {
                'barcode': order_product.product.barcode,
                'name': order_product.product.name,
                'movementStatus': order_product.product.move_status.name if order_product.product.move_status else 'Не указан',  # Проверка на None
            }
            for order_product in order_products
        ]
        
        # Формируем ответ с деталями заказа и продуктами
        response_data = {
            'orderNumber': order.OrderNumber,
            'status': {
                'id': order.status.id,
                'name': order.status.name
            },
            'products': products_data,
            'creator': {
                'first_name': order.creator.first_name,
                'last_name': order.creator.last_name
            } if order.creator else None,
        }
        
        return Response(response_data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)


@api_view(['PATCH'])
def update_order_status(request, orderNumber):
    try:
        # Получаем заказ по номеру
        order = Order.objects.get(OrderNumber=orderNumber)
        
        # Получаем новый статус из данных запроса
        new_status_id = request.data.get('status_id')
        if new_status_id is not None:
            order.status_id = new_status_id
            order.save()
            return Response({'message': 'Статус заказа обновлен'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'status_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_invoice_details(request, invoice_number):
    try:
        # Получаем накладную по номеру
        invoice = Invoice.objects.get(InvoiceNumber=invoice_number)
        
        # Получаем связанные продукты накладной
        products = InvoiceProduct.objects.filter(invoice=invoice)
        products_data = [
            {
                'barcode': product.product.barcode,
                'name': product.product.name,
                'quantity': 1,
                'cell': product.product.cell
            }
            for product in products
        ]
        
        invoice_data = {
            'InvoiceNumber': invoice.InvoiceNumber,
            'date': invoice.date,
            'creator': f"{invoice.creator.first_name} {invoice.creator.last_name}" if invoice.creator else "Не указан",
            'products': products_data
        }

        return Response(invoice_data, status=status.HTTP_200_OK)
    except Invoice.DoesNotExist:
        return Response({'error': 'Накладная не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def check_barcodes(request):
    barcodes = request.data.get('barcodes', [])
    missing_barcodes = []  # Здесь логика для проверки наличия штрихкодов в базе

    # Пример: добавьте штрихкоды в missing_barcodes, которые отсутствуют в базе
    for barcode in barcodes:
        if not Product.objects.filter(barcode=barcode).exists():
            missing_barcodes.append(barcode)
    
    return Response({'missing_barcodes': missing_barcodes}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        # Получаем штрихкоды из запроса
        barcodes = request.data.get('barcodes', [])

        # Проверяем, что все штрихкоды существуют в базе данных Product
        missing_barcodes = []
        valid_products = []
        
        for barcode in barcodes:
            product = Product.objects.filter(barcode=barcode).first()
            if product:
                valid_products.append(product)
            else:
                missing_barcodes.append(barcode)

        # Если есть отсутствующие штрихкоды, возвращаем ошибку
        if missing_barcodes:
            return Response({
                'error': 'Некоторые штрихкоды не найдены в базе данных.',
                'missing_barcodes': missing_barcodes
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Генерация нового номера заказа с проверкой уникальности
        last_order = Order.objects.aggregate(Max('OrderNumber'))
        new_order_number = int(last_order['OrderNumber__max'] or 0) + 1

        # Повторно проверяем на случай коллизий
        while Order.objects.filter(OrderNumber=new_order_number).exists():
            new_order_number += 1  # Если такой номер уже есть, увеличиваем на 1

        # Получаем текущую дату и время
        current_date = timezone.now()

        # Получаем текущего пользователя
        creator_id = request.user.id

        # Создаем новый заказ
        order = Order.objects.create(
            OrderNumber=new_order_number,
            date=current_date,
            creator_id=creator_id,
            status_id=2  # Устанавливаем статус на 2
        )

        # Привязываем штрихкоды к созданному заказу через OrderProduct
        for product in valid_products:
            OrderProduct.objects.create(order=order, product=product)

        # Сериализация и возврат данных нового заказа
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Error creating order: {e}")
        return Response({'error': 'Ошибка при создании заказа'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_products_batch(request):
    # Получаем данные из тела запроса
    data = request.data.get('data', [])
    
    # Проверка на отсутствие данных
    if not data:
        return Response({'error': 'Отсутствуют данные для загрузки'}, status=400)

    missing_data_rows = []  # Список для хранения строк с отсутствующими данными

    # Начинаем транзакцию для обработки данных
    with transaction.atomic():
        for index, row in enumerate(data):
            barcode = row.get('barcode')
            name = row.get('name')
            category_id = row.get('category_id')
            seller = row.get('seller')
            in_stock_sum = row.get('in_stock_sum')
            cell = row.get('cell')

            # Проверка на обязательные поля
            if not barcode or not name or category_id is None or seller is None or in_stock_sum is None:
                missing_data_rows.append({
                    'row': index + 1,
                    'barcode': barcode,
                    'name': name,
                    'category_id': category_id,
                    'seller': seller,
                    'in_stock_sum': in_stock_sum,
                    'cell': cell
                })
                continue  # Переходим к следующей записи

            try:
                # Создание или обновление записи
                Product.objects.update_or_create(
                    barcode=barcode,
                    defaults={
                        'name': name,
                        'category_id': category_id,
                        'seller': seller,
                        'in_stock_sum': in_stock_sum,
                        'cell': cell
                    }
                )
            except Exception as e:
                transaction.set_rollback(True)
                return Response({'error': f'Ошибка при загрузке данных: {str(e)}'}, status=400)

    # Проверка на наличие строк с отсутствующими обязательными данными
    if missing_data_rows:
        return Response({
            'error': 'Отсутствуют обязательные данные в строках.',
            'missing_data': missing_data_rows
        }, status=400)
    
    # Возвращаем успешный ответ, если все данные загружены корректно
    return Response({'message': 'Данные успешно загружены'}, status=201)

@api_view(['GET'])
def get_history_by_barcode(request, barcode):
    try:
        history = ProductOperation.objects.filter(product__barcode=barcode).select_related('operation_type', 'user')

        # Получаем параметры сортировки
        sort_field = request.query_params.get('sort_field', 'date')
        sort_order = request.query_params.get('sort_order', 'desc')

        # Проверяем, если запрос идет по связанному полю
        if sort_field == 'operation_type_name':
            sort_field = 'operation_type__name'
        elif sort_field == 'user_full_name':
            sort_field = 'user__first_name'  # Сортировка только по имени пользователя для простоты

        if sort_order == 'desc':
            sort_field = f'-{sort_field}'

        # Применяем сортировку
        history = history.order_by(sort_field)

        # Пагинация
        paginator = ProductHistoryPagination()
        paginated_history = paginator.paginate_queryset(history, request)

        # Подготовка данных для ответа
        data = [
            {
                "operation_type_name": entry.operation_type.name,
                "user_full_name": f"{entry.user.first_name} {entry.user.last_name}",
                "date": entry.date,
                "comment": entry.comment
            }
            for entry in paginated_history
        ]
        return paginator.get_paginated_response(data)

    except FieldError as e:
        return Response({'error': str(e)}, status=400)
    except ProductOperation.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

# View for Move Statuses
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def move_statuses(request):
    try:
        statuses = ProductMoveStatus.objects.all()
        serializer = StatusSerializer(statuses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View for Stockmen Users
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stockman_list(request):
    stockman_group = Group.objects.filter(name="Товаровед").first()
    if not stockman_group:
        return Response({"error": "Group 'Товаровед' not found"}, status=404)

    stockmen = User.objects.filter(groups=stockman_group)
    stockmen_data = [{"id": stockman.id, "name": f"{stockman.first_name} {stockman.last_name}"} for stockman in stockmen]

    return Response(stockmen_data)

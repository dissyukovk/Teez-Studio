from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count, Q, ExpressionWrapper, F, DurationField
from datetime import datetime
from core.models import (
    Order,
    OrderProduct,
    OrderStatus,
    Product,
    STRequest,
    STRequestProduct,
    STRequestStatus,
    STRequestHistory,
    STRequestHistoryOperations,
    ProductOperationTypes,
    ProductOperation
    )
from .serializers import (
    OrderSerializer,
    OrderStatusSerializer,
    OrderDetailSerializer
    )
from .pagination import StandardResultsSetPagination

#список заказов
class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = Order.objects.all()
        # Аннотации для вычисляемых полей (количества и разница дат)
        qs = qs.annotate(
            total_products=Count('orderproduct'),
            priority_products=Count('orderproduct', filter=Q(orderproduct__product__priority=True)),
            accepted_products=Count('orderproduct', filter=Q(orderproduct__accepted=True)),
            acceptance_time=ExpressionWrapper(F('accept_date_end') - F('accept_date'), output_field=DurationField())
        )

        params = self.request.query_params
        date_format = "%d.%m.%Y %H:%M:%S"

        # Фильтр по номерам заказов (передаётся массивом через запятую)
        order_numbers = params.get('order_numbers')
        if order_numbers:
            order_numbers_list = [num.strip() for num in order_numbers.split(',') if num.strip().isdigit()]
            if order_numbers_list:
                qs = qs.filter(OrderNumber__in=order_numbers_list)

        # Фильтр по статусам (массив id через запятую)
        statuses = params.get('statuses')
        if statuses:
            status_list = [s.strip() for s in statuses.split(',') if s.strip().isdigit()]
            if status_list:
                qs = qs.filter(status__id__in=status_list)

        # Фильтрация по дате создания (включительно)
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        if date_from:
            try:
                dt_from = datetime.strptime(date_from, date_format)
                qs = qs.filter(date__gte=dt_from)
            except ValueError:
                pass
        if date_to:
            try:
                dt_to = datetime.strptime(date_to, date_format)
                qs = qs.filter(date__lte=dt_to)
            except ValueError:
                pass

        # Фильтрация по дате сборки
        assembly_date_from = params.get('assembly_date_from')
        assembly_date_to = params.get('assembly_date_to')
        if assembly_date_from:
            try:
                ad_from = datetime.strptime(assembly_date_from, date_format)
                qs = qs.filter(assembly_date__gte=ad_from)
            except ValueError:
                pass
        if assembly_date_to:
            try:
                ad_to = datetime.strptime(assembly_date_to, date_format)
                qs = qs.filter(assembly_date__lte=ad_to)
            except ValueError:
                pass

        # Фильтрация по дате приемки (начало)
        accept_date_from = params.get('accept_date_from')
        accept_date_to = params.get('accept_date_to')
        if accept_date_from:
            try:
                ac_from = datetime.strptime(accept_date_from, date_format)
                qs = qs.filter(accept_date__gte=ac_from)
            except ValueError:
                pass
        if accept_date_to:
            try:
                ac_to = datetime.strptime(accept_date_to, date_format)
                qs = qs.filter(accept_date__lte=ac_to)
            except ValueError:
                pass

        # Фильтрация по штрихкодам (через OrderProduct -> Product)
        barcodes = params.get('barcodes')
        if barcodes:
            barcode_list = [b.strip() for b in barcodes.split(',') if b.strip()]
            qs = qs.filter(orderproduct__product__barcode__in=barcode_list).distinct()
            self.barcode_list = barcode_list  # сохраняем для вычисления "не найденных"
        else:
            self.barcode_list = None

        # Сортировка – можно передать через параметр ordering, например:
        # ?ordering=OrderNumber или ?ordering=-date
        ordering = params.get('ordering')
        if ordering:
            ordering_fields = [field.strip() for field in ordering.split(',')]
            qs = qs.order_by(*ordering_fields)

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Если фильтруется по штрихкодам – вычисляем, какие из переданных не найдены
        not_found_barcodes = []
        if self.barcode_list:
            found_barcodes = set(OrderProduct.objects.filter(order__in=queryset)
                                 .values_list('product__barcode', flat=True))
            not_found_barcodes = list(set(self.barcode_list) - found_barcodes)

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        data = self.get_paginated_response(serializer.data).data
        if self.barcode_list:
            data['not_found_barcodes'] = not_found_barcodes
        return Response(data)

#эндпоинт на список статусов заказов для фильтра на фронте
class OrderStatusListView(generics.ListAPIView):
    queryset = OrderStatus.objects.all()
    serializer_class = OrderStatusSerializer
    pagination_class = None

#Детали заказа
class OrderDetailAPIView(APIView):
    def get(self, request, order_number, format=None):
        order = get_object_or_404(Order, OrderNumber=order_number)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)

#Приемка заказа товароведом
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_accept_start(request, ordernumber):
    # Поиск заказа по OrderNumber
    try:
        order = Order.objects.get(OrderNumber=ordernumber)
    except Order.DoesNotExist:
        return Response({"error": "Заказ не найден."}, status=status.HTTP_404_NOT_FOUND)
    
    # Установка пользователя, который принял заказ
    order.accept_user = request.user
    # Установка даты и времени приемки
    order.accept_date = timezone.now()
    
    # Обновление статуса заказа на статус с id=4
    try:
        new_status = OrderStatus.objects.get(pk=4)
    except OrderStatus.DoesNotExist:
        return Response({"error": "Статус заказа с id 4 не найден."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    order.status = new_status
    order.save()
    
    return Response({"message": "Приемка заказа начата успешно."}, status=status.HTTP_200_OK)

#Проверка товара в заказе
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_check_product(request, ordernumber, barcode):
    # Поиск заказа по OrderNumber
    order = get_object_or_404(Order, OrderNumber=ordernumber)
    
    # Поиск товара в заказе через модель OrderProduct
    try:
        order_product = OrderProduct.objects.get(order=order, product__barcode=barcode)
    except OrderProduct.DoesNotExist:
        return Response({"error": "Штрихкод не найден в этом заказе."},
                        status=status.HTTP_404_NOT_FOUND)
    
    product = order_product.product
    # Формируем информацию о товаре
    product_data = {
        "barcode": product.barcode,
        "name": product.name,
        "move_status": product.move_status.name if product.move_status else None,
        "info": product.info
    }
    
    # Проверка наличия товара в заявках со статусами 2 и 3
    st_req_product = STRequestProduct.objects.filter(
        product=product,
        request__status__id__in=[2, 3]
    ).first()
    
    if st_req_product:
        duplicate = True
        strequestnumber = st_req_product.request.RequestNumber
    else:
        duplicate = False
        strequestnumber = ""
    
    response_data = {
        "product": product_data,
        "duplicate": duplicate,
        "strequestnumber": strequestnumber
    }
    
    return Response(response_data, status=status.HTTP_200_OK)

#Приемка товара в заказе
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_accept_product(request, ordernumber):
    # Поиск заказа по OrderNumber
    try:
        order = Order.objects.get(OrderNumber=ordernumber)
    except Order.DoesNotExist:
        return Response({"error": "Заказ не найден."}, status=status.HTTP_404_NOT_FOUND)
    
    # Получаем массив штрихкодов из тела запроса
    barcodes = request.data.get("barcodes")
    if barcodes is None:
        return Response({"error": "Массив штрихкодов не передан."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(barcodes, list):
        return Response({"error": "Баркоды должны передаваться в виде списка."}, status=status.HTTP_400_BAD_REQUEST)

    results = []
    for barcode in barcodes:
        barcode_result = {"barcode": barcode}
        # Находим продукт по штрихкоду
        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            barcode_result["error"] = "Продукт с данным штрихкодом не найден."
            results.append(barcode_result)
            continue

        # Обновляем поля модели Product
        product.move_status_id = 3  # статус "приемки", предполагается, что статус с id=3 существует
        product.income_stockman = request.user
        product.income_date = timezone.now()
        product.save()

        # Создаем запись в ProductOperation
        try:
            operation_type = ProductOperationTypes.objects.get(pk=3)
        except ProductOperationTypes.DoesNotExist:
            barcode_result["error"] = "Тип операции с id 3 не найден."
            results.append(barcode_result)
            continue

        ProductOperation.objects.create(
            product=product,
            operation_type=operation_type,
            user=request.user,
            # date выставится автоматически через auto_now_add
        )

        # Обновляем запись в OrderProduct
        try:
            order_product = OrderProduct.objects.get(order=order, product=product)
        except OrderProduct.DoesNotExist:
            barcode_result["error"] = "Продукт не найден в заказе."
            results.append(barcode_result)
            continue

        order_product.accepted = True
        order_product.accepted_date = timezone.now()
        order_product.save()

        barcode_result["status"] = "Продукт успешно принят."
        results.append(barcode_result)

    return Response({"results": results}, status=status.HTTP_200_OK)

#получение следующего номера заявки
def get_next_request_number():
    """
    Вспомогательная функция для вычисления следующего номера заявки.
    Если заявок нет или RequestNumber некорректен, начальное значение равно 1.
    """
    last_request = STRequest.objects.order_by('-RequestNumber').first()
    if last_request:
        try:
            last_number = int(last_request.RequestNumber)
        except ValueError:
            last_number = 0
    else:
        last_number = 0
    new_number = last_number + 1
    return str(new_number)

#создание новой заявки (пустой черновик)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def strequest_create(request):
    """
    Эндпоинт для создания новой заявки.
    URL: /strequest-create/
    
    Логика:
    1. Получаем следующий номер заявки через вспомогательную функцию.
    2. Находим статус заявки с id=1.
    3. Создаем новую заявку с:
       - RequestNumber – следующий номер,
       - stockman – пользователь запроса,
       - creation_date – текущее время (автоматически через auto_now_add или можно явно задать).
    4. Возвращаем созданный номер заявки.
    """
    next_number = get_next_request_number()
    
    try:
        status_instance = STRequestStatus.objects.get(pk=1)
    except STRequestStatus.DoesNotExist:
        return Response(
            {"error": "Статус заявки с id=1 не найден."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    new_request = STRequest.objects.create(
        RequestNumber=next_number,
        stockman=request.user,
        status=status_instance
        # creation_date можно не передавать, если в модели стоит auto_now_add=True
    )
    
    return Response({"RequestNumber": new_request.RequestNumber}, status=status.HTTP_201_CREATED)

#создание заявки с шк
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def strequest_create_barcodes(request):
    barcodes = request.data.get("barcodes")
    if barcodes is None:
        return Response({"error": "Массив штрихкодов не передан."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(barcodes, list):
        return Response({"error": "Баркоды должны передаваться в виде списка."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Получаем следующий номер заявки
    next_number = get_next_request_number()
    
    # Получаем статус заявки с id=2
    try:
        status_instance = STRequestStatus.objects.get(pk=2)
    except STRequestStatus.DoesNotExist:
        return Response({"error": "Статус заявки с id=2 не найден."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Создаем новую заявку
    new_request = STRequest.objects.create(
        RequestNumber=next_number,
        stockman=request.user,
        status=status_instance
    )
    
    # Получаем тип операции для истории с id=1
    try:
        history_operation = STRequestHistoryOperations.objects.get(pk=1)
    except STRequestHistoryOperations.DoesNotExist:
        return Response({"error": "Тип операции для истории с id=1 не найден."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    barcode_results = []
    # Привязываем каждый штрихкод к созданной заявке и создаем историю операции
    for barcode in barcodes:
        result_item = {"barcode": barcode}
        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            result_item["error"] = "Продукт с данным штрихкодом не найден."
            barcode_results.append(result_item)
            continue
        
        # Создаем связь в модели STRequestProduct
        STRequestProduct.objects.create(
            request=new_request,
            product=product
        )
        
        # Создаем запись в истории операций заявки
        STRequestHistory.objects.create(
            st_request=new_request,
            product=product,
            user=request.user,
            operation=history_operation
        )
        
        result_item["status"] = "Продукт успешно привязан к заявке и добавлен в историю."
        barcode_results.append(result_item)
    
    response_data = {
        "RequestNumber": new_request.RequestNumber,
        "barcode_results": barcode_results
    }
    
    return Response(response_data, status=status.HTTP_201_CREATED)

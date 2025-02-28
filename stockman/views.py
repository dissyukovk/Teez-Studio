from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Count, Q, ExpressionWrapper, F, DurationField
from datetime import datetime

from core.models import Order, OrderProduct, OrderStatus
from .serializers import OrderSerializer, OrderStatusSerializer
from .pagination import StandardResultsSetPagination


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


class OrderStatusListView(generics.ListAPIView):
    queryset = OrderStatus.objects.all()
    serializer_class = OrderStatusSerializer
    pagination_class = None


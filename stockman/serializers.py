from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import (
    Order,
    OrderStatus,
    OrderProduct,
    Product,
    STRequest,
    STRequestStatus
    )

class OrderSerializer(serializers.ModelSerializer):
    order_number = serializers.IntegerField(source='OrderNumber')
    creation_date = serializers.SerializerMethodField()
    creator = serializers.SerializerMethodField()
    status_id = serializers.IntegerField(source='status.id')
    status_name = serializers.CharField(source='status.name')
    assembly_date = serializers.SerializerMethodField()
    assembly_user = serializers.SerializerMethodField()
    accept_date = serializers.SerializerMethodField()
    accept_date_end = serializers.SerializerMethodField()
    acceptance_time = serializers.SerializerMethodField()
    accept_user = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    priority_products = serializers.SerializerMethodField()
    accepted_products = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'order_number',
            'creation_date',
            'creator',
            'status_id',
            'status_name',
            'assembly_date',
            'assembly_user',
            'accept_date',
            'accept_date_end',
            'acceptance_time',
            'accept_user',
            'total_products',
            'priority_products',
            'accepted_products'
        )

    def get_creation_date(self, obj):
        if obj.date:
            return obj.date.strftime("%d.%m.%Y %H:%M:%S")
        return None

    def get_assembly_date(self, obj):
        if obj.assembly_date:
            return obj.assembly_date.strftime("%d.%m.%Y %H:%M:%S")
        return None

    def get_accept_date(self, obj):
        if obj.accept_date:
            return obj.accept_date.strftime("%d.%m.%Y %H:%M:%S")
        return None

    def get_accept_date_end(self, obj):
        if obj.accept_date_end:
            return obj.accept_date_end.strftime("%d.%m.%Y %H:%M:%S")
        return None

    def get_acceptance_time(self, obj):
        if obj.accept_date and obj.accept_date_end:
            diff = obj.accept_date_end - obj.accept_date
            total_seconds = int(diff.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            return f"{hours:02}:{minutes:02}:{seconds:02}"
        return None

    def get_total_products(self, obj):
        return obj.orderproduct_set.count()

    def get_priority_products(self, obj):
        return obj.orderproduct_set.filter(product__priority=True).count()

    def get_accepted_products(self, obj):
        return obj.orderproduct_set.filter(accepted=True).count()

    def get_creator(self, obj):
        if obj.creator:
            full_name = f"{obj.creator.first_name} {obj.creator.last_name}".strip()
            return full_name if full_name else None
        return None

    def get_assembly_user(self, obj):
        if obj.assembly_user:
            full_name = f"{obj.assembly_user.first_name} {obj.assembly_user.last_name}".strip()
            return full_name if full_name else None
        return None

    def get_accept_user(self, obj):
        if obj.accept_user:
            full_name = f"{obj.accept_user.first_name} {obj.accept_user.last_name}".strip()
            return full_name if full_name else None
        return None


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ('id', 'name')

class OrderProductSerializer(serializers.ModelSerializer):
    barcode = serializers.CharField(source='product.barcode')
    name = serializers.CharField(source='product.name')
    cell = serializers.CharField(source='product.cell')
    seller = serializers.IntegerField(source='product.seller', allow_null=True)
    product_move_status_name = serializers.CharField(source='product.move_status.name', default=None)
    product_move_status_id = serializers.IntegerField(source='product.move_status.id', default=None)
    accepted_date = serializers.SerializerMethodField()

    def get_accepted_date(self, obj):
        if obj.accepted_date:
            return obj.accepted_date.strftime("%d.%m.%Y %H:%M:%S")
        return None

    class Meta:
        model = OrderProduct
        fields = [
            "barcode",
            "name",
            "cell",
            "seller",
            "product_move_status_name",
            "product_move_status_id",
            "accepted",
            "accepted_date",
        ]

class OrderDetailSerializer(serializers.ModelSerializer):
    order_number = serializers.IntegerField(source='OrderNumber')
    order_status = serializers.SerializerMethodField()
    creator = serializers.SerializerMethodField()
    assembly_user = serializers.SerializerMethodField()
    accept_user = serializers.SerializerMethodField()
    assembly_date = serializers.SerializerMethodField()
    accept_date = serializers.SerializerMethodField()
    accept_date_end = serializers.SerializerMethodField()
    accept_time = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    priority_products = serializers.SerializerMethodField()
    accepted_products = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()  # Дата создания заказа
    products = OrderProductSerializer(source='orderproduct_set', many=True)

    def get_order_status(self, obj):
        if obj.status:
            return {"id": obj.status.id, "name": obj.status.name}
        return None

    def get_creator(self, obj):
        if obj.creator:
            return f"{obj.creator.first_name} {obj.creator.last_name}"
        return None

    def get_assembly_user(self, obj):
        if obj.assembly_user:
            return f"{obj.assembly_user.first_name} {obj.assembly_user.last_name}"
        return None

    def get_accept_user(self, obj):
        if obj.accept_user:
            return f"{obj.accept_user.first_name} {obj.accept_user.last_name}"
        return None

    def format_date(self, dt):
        return dt.strftime("%d.%m.%Y %H:%M:%S") if dt else None

    def get_assembly_date(self, obj):
        return self.format_date(obj.assembly_date)

    def get_accept_date(self, obj):
        return self.format_date(obj.accept_date)

    def get_accept_date_end(self, obj):
        return self.format_date(obj.accept_date_end)

    def get_accept_time(self, obj):
        if obj.accept_date and obj.accept_date_end:
            delta = obj.accept_date_end - obj.accept_date
            total_seconds = int(delta.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return None

    def get_total_products(self, obj):
        return obj.orderproduct_set.count()

    def get_priority_products(self, obj):
        return obj.orderproduct_set.filter(product__priority=True).count()

    def get_accepted_products(self, obj):
        return obj.orderproduct_set.filter(accepted=True).count()

    def get_date(self, obj):
        return self.format_date(obj.date)

    class Meta:
        model = Order
        fields = [
            "order_number",
            "date",
            "order_status",
            "creator",
            "assembly_user",
            "assembly_date",
            "accept_user",
            "accept_date",
            "accept_date_end",
            "accept_time",
            "total_products",
            "priority_products",
            "accepted_products",
            "products",
        ]

class STRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = STRequestStatus
        fields = ('id', 'name')

class STRequestSerializer(serializers.ModelSerializer):
    # Форматирование дат
    creation_date = serializers.DateTimeField(format="%d.%m.%Y %H:%M:%S", read_only=True)
    photo_date = serializers.DateTimeField(format="%d.%m.%Y %H:%M:%S", read_only=True, allow_null=True)
    assistant_date = serializers.DateTimeField(format="%d.%m.%Y %H:%M:%S", read_only=True, allow_null=True)
    
    # Пользователи: возвращаем ФИО
    stockman = serializers.SerializerMethodField()
    photographer = serializers.SerializerMethodField()
    assistant = serializers.SerializerMethodField()
    
    # Статус заявки – вложенный сериалайзер
    status = STRequestStatusSerializer(read_only=True)
    
    # Вычисляем количество товаров и количество приоритетных товаров
    products_count = serializers.SerializerMethodField()
    priority_products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = STRequest
        fields = [
            'RequestNumber',
            'creation_date',
            'stockman',
            'status',
            'photographer',
            'photo_date',
            'assistant',
            'assistant_date',
            'products_count',
            'priority_products_count'
        ]
    
    def get_stockman(self, obj):
        if obj.stockman:
            return f"{obj.stockman.first_name} {obj.stockman.last_name}".strip()
        return None

    def get_photographer(self, obj):
        if obj.photographer:
            return f"{obj.photographer.first_name} {obj.photographer.last_name}".strip()
        return None

    def get_assistant(self, obj):
        if obj.assistant:
            return f"{obj.assistant.first_name} {obj.assistant.last_name}".strip()
        return None

    def get_products_count(self, obj):
        # Если не указан related_name в модели STRequestProduct, по умолчанию используется strequestproduct_set
        return obj.strequestproduct_set.count()

    def get_priority_products_count(self, obj):
        return obj.strequestproduct_set.filter(product__priority=True).count()

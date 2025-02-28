from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Order, OrderStatus

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

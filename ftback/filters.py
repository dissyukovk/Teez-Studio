import django_filters
from core.models import STRequestProduct

class SRReadyProductFilter(django_filters.FilterSet):
    barcode = django_filters.CharFilter(field_name='product__barcode', lookup_expr='icontains')
    name = django_filters.CharFilter(field_name='product__name', lookup_expr='icontains')
    OnRetouch = django_filters.BooleanFilter(field_name='OnRetouch')
    priority = django_filters.BooleanFilter(field_name='product__priority')
    photo_date = django_filters.DateTimeFromToRangeFilter(field_name='request__photo_date')
    # Добавляем фильтр по статусу. Допустим, статус лежит в STRequest, связанной через request
    # Если статус - ForeignKey, можно фильтровать по ID: status_id
    # Или, если статус - CharField, по имени.
    status = django_filters.NumberFilter(field_name='request__status_id')  # пример, если статус - числовой id

    class Meta:
        model = STRequestProduct
        fields = ['barcode', 'name', 'OnRetouch', 'priority', 'photo_date', 'status']

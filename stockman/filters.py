import django_filters
from core.models import STRequest

class STRequestFilter(django_filters.FilterSet):
    # Фильтр по номерам заявок (массив номеров через запятую)
    request_numbers = django_filters.CharFilter(method='filter_request_numbers')
    # Фильтр по штрихкодам через связь с STRequestProduct
    barcodes = django_filters.CharFilter(method='filter_barcodes')
    # Фильтры по дате создания (формат дд.мм.гггг)
    creation_date_from = django_filters.DateFilter(field_name='creation_date', lookup_expr='gte', input_formats=['%d.%m.%Y'])
    creation_date_to = django_filters.DateFilter(field_name='creation_date', lookup_expr='lte', input_formats=['%d.%m.%Y'])
    # Фильтр по статусам (массив id через запятую)
    statuses = django_filters.CharFilter(method='filter_statuses')
    # Фильтр по товароведу (stockman) – массив id через запятую
    stockman = django_filters.CharFilter(method='filter_stockman')
    # Фильтр по фотографу – массив id через запятую
    photographer = django_filters.CharFilter(method='filter_photographer')
    # Фильтры по дате фото (формат дд.мм.гггг)
    photo_date_from = django_filters.DateFilter(field_name='photo_date', lookup_expr='gte', input_formats=['%d.%m.%Y'])
    photo_date_to = django_filters.DateFilter(field_name='photo_date', lookup_expr='lte', input_formats=['%d.%m.%Y'])
    
    def filter_request_numbers(self, queryset, name, value):
        numbers = [v.strip() for v in value.split(',') if v.strip()]
        if numbers:
            queryset = queryset.filter(RequestNumber__in=numbers)
        return queryset

    def filter_barcodes(self, queryset, name, value):
        codes = [v.strip() for v in value.split(',') if v.strip()]
        if codes:
            queryset = queryset.filter(strequestproduct_set__product__barcode__in=codes).distinct()
        return queryset

    def filter_statuses(self, queryset, name, value):
        status_ids = [v.strip() for v in value.split(',') if v.strip()]
        if status_ids:
            queryset = queryset.filter(status__id__in=status_ids)
        return queryset

    def filter_stockman(self, queryset, name, value):
        stockman_ids = [v.strip() for v in value.split(',') if v.strip()]
        if stockman_ids:
            queryset = queryset.filter(stockman__id__in=stockman_ids)
        return queryset

    def filter_photographer(self, queryset, name, value):
        photographer_ids = [v.strip() for v in value.split(',') if v.strip()]
        if photographer_ids:
            queryset = queryset.filter(photographer__id__in=photographer_ids)
        return queryset

    class Meta:
        model = STRequest
        fields = []

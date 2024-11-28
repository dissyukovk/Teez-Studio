from django.contrib import admin
from .models import STRequest, STRequestProduct, Product, ProductCategory, ProductMoveStatus, RetouchStatus, Order, OrderProduct, OrderStatus, Invoice, InvoiceProduct, STRequestStatus, ProductOperation, ProductOperationTypes, UserURLs, STRequestHistory, STRequestHistoryOperations, PhotoStatus, Camera

# Admin for STRequestStatus
@admin.register(STRequestStatus)
class STRequestStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

# Admin for STRequest
@admin.register(STRequest)
class STRequestAdmin(admin.ModelAdmin):
    list_display = [
        'RequestNumber', 'photographer', 'retoucher', 'stockman',
        'creation_date', 'status', 'photo_date', 'retouch_date'
    ]
    search_fields = ['RequestNumber', 'status__name']
    list_filter = ['status', 'creation_date']
    ordering = ['creation_date']

# Admin for STRequestProduct
@admin.register(STRequestProduct)
class STRequestProductAdmin(admin.ModelAdmin):
    list_display = ['request', 'product', 'retouch_status']
    search_fields = ['request__RequestNumber', 'product__name']
    list_filter = ['retouch_status']
    ordering = ['request']

# Admin for Product
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['barcode', 'name', 'category', 'in_stock_sum', 'seller', 'move_status', 'income_date', 'outcome_date']
    search_fields = ['barcode', 'name']
    list_filter = ['category', 'move_status']
    ordering = ['name']

# Admin for ProductCategory
@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['name']

# Admin for ProductMoveStatus
@admin.register(ProductMoveStatus)
class ProductMoveStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['name']

# Admin for RetouchStatus
@admin.register(RetouchStatus)
class RetouchStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['name']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['OrderNumber', 'date', 'creator', 'status']
    search_fields = ['OrderNumber', 'creator__username']
    ordering = ['OrderNumber']

@admin.register(OrderStatus)
class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

@admin.register(OrderProduct)
class OrderProductAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'assembled', 'assembled_date', 'accepted', 'accepted_date']
    search_fields = ['order__OrderNumber', 'product__name']
    ordering = ['order']

# Admin for Invoice
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['InvoiceNumber', 'date', 'creator']
    search_fields = ['InvoiceNumber', 'creator__username']
    ordering = ['date']

# Admin for InvoiceProduct
@admin.register(InvoiceProduct)
class InvoiceProductAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'product']
    search_fields = ['invoice__InvoiceNumber', 'product__name']
    ordering = ['invoice']

# Admin для ProductOperation
@admin.register(ProductOperation)
class ProductOperationAdmin(admin.ModelAdmin):
    list_display = ('product', 'operation_type', 'user', 'date', 'comment')
    list_filter = ('operation_type', 'date')
    search_fields = ('product__barcode', 'operation_type__name', 'user__username')

@admin.register(ProductOperationTypes)
class ProductOperationTypesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    
@admin.register(UserURLs)
class UserURLsAdmin(admin.ModelAdmin):
    list_display = ('user', 'income_url', 'outcome_url')

@admin.register(STRequestHistoryOperations)
class STRequestHistoryOperationsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('id', 'name',)

@admin.register(STRequestHistory)
class STRequestHistoryAdmin(admin.ModelAdmin):
    list_display = ('st_request', 'product', 'user', 'date', 'operation')
    search_fields = ('st_request__RequestNumber', 'product__barcode', 'user__username', 'operation__name')
    list_filter = ('operation', 'date')

# Admin for PhotoStatus
@admin.register(PhotoStatus)
class PhotoStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    ordering = ('name',)

# Admin for Camera
@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ('id', 'IP')
    search_fields = ('IP',)

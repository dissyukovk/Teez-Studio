from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserProfileListCreateView.as_view(), name='userprofile-list'),
    path('users/<int:pk>/', views.UserProfileDetailView.as_view(), name='userprofile-detail'),
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('strequests/', views.STRequestListCreateView.as_view(), name='strequest-list'),
    path('strequests/<int:pk>/', views.STRequestDetailView.as_view(), name='strequest-detail'),
    path('user-info/', views.UserInfoView.as_view(), name='user-info'),
    path('user/on-work/', views.UpdateOnWorkView.as_view(), name='update-on-work'),
    path('photographer-requests/', views.PhotographerSTRequestListView.as_view(), name='photographer-requests'),
    path('photographer-request/<str:request_number>/', views.PhotographerSTRequestDetailView.as_view(), name='photographer-request-detail'),
    path('photographercamera/', views.CameraListView.as_view(), name='photographercamera-list'),
    path("photographerproduct/<str:barcode>/", views.PhotographerProductView.as_view(), name="photographer-product"),
    path('photographer/update-product-status/', views.PhotographerUpdateProductView.as_view(), name='photographer-update-product-status'),
    path('sphotographer/requests/', views.SPhotographerRequestsListView.as_view(), name='sphotographer-requests'),
    path('photo_status_list/', views.PhotoStatusListView.as_view(), name='photo-status-list'),
    path('sphoto_status_list/', views.SPhotoStatusListView.as_view(), name='sphoto-status-list'),
    path('sphotographer/request-detail/', views.SPhotographerRequestDetailView.as_view(), name='sphotographer-request-detail'),
    path('sphotographer/onwork-photographers/', views.OnWorkPhotographersListView.as_view(), name='onwork-photographers'),
    path('sphotographer/update-sphoto-status/', views.UpdateSPhotoStatusView.as_view(), name='update-sphoto-status'),
    path('sphotographer/assign-request/', views.AssignRequestToPhotographerView.as_view(), name='assign-request'),
]

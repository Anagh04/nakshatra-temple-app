from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DevoteeViewSet,
    register,
    bulk_upload,
    delete_nakshatra_data,   # ✅ import this
)

router = DefaultRouter()
router.register(r'devotees', DevoteeViewSet, basename='devotee')

urlpatterns = [
    path('register/', register),
    path('bulk-upload/', bulk_upload),

    # ✅ NEW DELETE NAKSHATRA API
    path(
        'delete-nakshatra/<str:nakshatra_name>/',
        delete_nakshatra_data
    ),
]

urlpatterns += router.urls

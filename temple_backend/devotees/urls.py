from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DevoteeViewSet,
    register,
    bulk_upload,
    delete_nakshatra_data,
)

# 🔁 Router for CRUD operations
router = DefaultRouter()
router.register(r'devotees', DevoteeViewSet, basename='devotee')

urlpatterns = [
    # ✅ Register single devotee
    path(
        'register/',
        register,
        name='register-devotee'
    ),

    # ✅ Bulk CSV upload
    path(
        'bulk-upload/',
        bulk_upload,
        name='bulk-upload'
    ),

    # ✅ Delete all devotees under a Nakshatra
    path(
        'delete-nakshatra/<str:nakshatra_name>/',
        delete_nakshatra_data,
        name='delete-nakshatra'
    ),
]

# ✅ Include router URLs
urlpatterns += router.urls

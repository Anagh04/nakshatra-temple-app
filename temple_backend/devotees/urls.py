from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DevoteeViewSet,
    DuplicateEntryViewSet,
    InvalidEntryViewSet,
    register,
    bulk_upload,
    delete_nakshatra_data,
)

# ============================================================
# ROUTER
# ============================================================

router = DefaultRouter()

# Main Devotee table
router.register(r'devotees', DevoteeViewSet, basename='devotee')

# 🔥 NEW ROUTES
router.register(r'duplicates', DuplicateEntryViewSet, basename='duplicate')
router.register(r'invalid', InvalidEntryViewSet, basename='invalid')

# ============================================================
# URL PATTERNS
# ============================================================

urlpatterns = [

    # Register user
    path(
        'register/',
        register,
        name='register-devotee'
    ),

    # Bulk upload
    path(
        'bulk-upload/',
        bulk_upload,
        name='bulk-upload'
    ),

    # Delete devotees by nakshatra
    path(
        'delete-nakshatra/<str:nakshatra_name>/',
        delete_nakshatra_data,
        name='delete-nakshatra'
    ),
]

# Include router URLs
urlpatterns += router.urls

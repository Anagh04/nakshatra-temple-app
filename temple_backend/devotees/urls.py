from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DevoteeViewSet,
    DuplicateEntryViewSet,
    InvalidEntryViewSet,
    register,
    bulk_upload,
    delete_nakshatra_data,
    delete_all_duplicates,   # ✅ NEW
    delete_all_invalids,     # ✅ NEW
)

router = DefaultRouter()

# Main Devotee table
router.register(r'devotees', DevoteeViewSet, basename='devotee')

# Duplicates
router.register(r'duplicates', DuplicateEntryViewSet, basename='duplicate')

# Invalids
router.register(r'invalids', InvalidEntryViewSet, basename='invalid')

urlpatterns = [

    path('register/', register, name='register-devotee'),

    path('bulk-upload/', bulk_upload, name='bulk-upload'),

    path(
        'delete-nakshatra/<str:nakshatra_name>/',
        delete_nakshatra_data,
        name='delete-nakshatra'
    ),

    # ✅ NEW FAST DELETE APIs
    path('delete-all-duplicates/', delete_all_duplicates, name='delete-all-duplicates'),
    path('delete-all-invalids/', delete_all_invalids, name='delete-all-invalids'),
]

urlpatterns += router.urls

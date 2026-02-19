from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # ✅ Health check route for Render
    path('', lambda request: HttpResponse("Server Running")),

    path('admin/', admin.site.urls),

    # 🔥 JWT routes FIRST
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 🔥 Then include app routes
    path('api/', include('devotees.urls')),
]

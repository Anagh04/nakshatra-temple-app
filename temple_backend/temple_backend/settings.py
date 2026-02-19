"""
Django settings for temple_backend project.
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ==================================================
# SECURITY
# ==================================================

SECRET_KEY = os.environ.get("SECRET_KEY", "unsafe-secret")

DEBUG = os.environ.get("DEBUG", "False") == "True"

# Only backend domains here
ALLOWED_HOSTS = [
    "nakshatra-temple-app.onrender.com",
    "localhost",
    "127.0.0.1",
]

# ==================================================
# APPLICATIONS
# ==================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",

    "devotees",
]

# ==================================================
# MIDDLEWARE
# ==================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # MUST be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ==================================================
# REST FRAMEWORK
# ==================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=6),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# ==================================================
# CORS CONFIG
# ==================================================

# Only frontend domains here
CORS_ALLOWED_ORIGINS = [
    "https://varahi-nakshatrapooja-app.vercel.app",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

# ==================================================
# DATABASE CONFIGURATION
# ==================================================

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Production (Render PostgreSQL)
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    # Local Development (MySQL - XAMPP)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": "temple_db",
            "USER": "root",
            "PASSWORD": "",
            "HOST": "127.0.0.1",
            "PORT": "3306",
            "OPTIONS": {
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'"
            }
        }
    }

# ==================================================
# TEMPLATES
# ==================================================

ROOT_URLCONF = "temple_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "temple_backend.wsgi.application"

# ==================================================
# STATIC FILES
# ==================================================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ==================================================
# DEFAULT SETTINGS
# ==================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

TIME_ZONE = "Asia/Kolkata"
USE_TZ = True

# ==================================================
# PRODUCTION SECURITY
# ==================================================

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True

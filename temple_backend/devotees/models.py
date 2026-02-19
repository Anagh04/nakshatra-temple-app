from django.db import models


class Devotee(models.Model):

    # ============================================================
    # 🌟 Nakshatra Choices (ALL UPPERCASE)
    # ============================================================

    NAKSHATRA_CHOICES = [
        ("ASWATHY", "ASWATHY"),
        ("BHARANI", "BHARANI"),
        ("KARTHIKA", "KARTHIKA"),
        ("ROHINI", "ROHINI"),
        ("MAKAYIRAM", "MAKAYIRAM"),
        ("THIRUVATHIRA", "THIRUVATHIRA"),
        ("PUNARTHAM", "PUNARTHAM"),
        ("POOYAM", "POOYAM"),
        ("AYILYAM", "AYILYAM"),
        ("MAKAM", "MAKAM"),
        ("POORAM", "POORAM"),
        ("UTHRAM", "UTHRAM"),
        ("ATHAM", "ATHAM"),
        ("CHITHRIA", "CHITHRIA"),
        ("CHOTHI", "CHOTHI"),
        ("VISHAKHAM", "VISHAKHAM"),
        ("ANIZHAM", "ANIZHAM"),
        ("THRIKKETTA", "THRIKKETTA"),
        ("MOOLAM", "MOOLAM"),
        ("POORADAM", "POORADAM"),
        ("UTHRADAM", "UTHRADAM"),
        ("THIRUVONAM", "THIRUVONAM"),
        ("AVITTAM", "AVITTAM"),
        ("CHATHAYAM", "CHATHAYAM"),
        ("POORURUTTATHI", "POORURUTTATHI"),
        ("UTHRUTTATHI", "UTHRUTTATHI"),
        ("REVATHI", "REVATHI"),
    ]

    # ============================================================
    # 🧍 Basic Information
    # ============================================================

    name = models.CharField(
        max_length=100,
        db_index=True
    )

    country_code = models.CharField(
        max_length=10
    )

    phone = models.CharField(
        max_length=15,
        db_index=True
    )

    # ============================================================
    # 🌙 Nakshatra Field
    # ============================================================

    nakshatra = models.CharField(
        max_length=50,
        choices=NAKSHATRA_CHOICES,
        db_index=True
    )

    # ============================================================
    # 🕒 Timestamp
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # ============================================================
    # META CONFIGURATION
    # ============================================================

    class Meta:

        indexes = [
            models.Index(fields=['name', 'phone']),
            models.Index(fields=['nakshatra', 'created_at']),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=['name', 'country_code', 'phone', 'nakshatra'],
                name='unique_devotee_per_nakshatra'
            )
        ]

        ordering = ['-created_at']

        verbose_name = "Devotee"
        verbose_name_plural = "Devotees"

    # ============================================================
    # STRING REPRESENTATION
    # ============================================================

    def __str__(self):
        return f"{self.name} ({self.country_code}{self.phone}) - {self.nakshatra}"

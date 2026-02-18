from django.db import models


class Devotee(models.Model):

    NAKSHATRA_CHOICES = [
        ("Aswathy", "Aswathy"),
        ("Bharani", "Bharani"),
        ("Karthika", "Karthika"),
        ("Rohini", "Rohini"),
        ("Makayiram", "Makayiram"),
        ("Thiruvathira", "Thiruvathira"),
        ("Punartham", "Punartham"),
        ("Pooyam", "Pooyam"),
        ("Ayilyam", "Ayilyam"),
        ("Makam", "Makam"),
        ("Pooram", "Pooram"),
        ("Uthram", "Uthram"),
        ("Atham", "Atham"),
        ("Chithria", "Chithria"),
        ("Chothi", "Chothi"),
        ("Vishakham", "Vishakham"),
        ("Anizham", "Anizham"),
        ("Thrikketta", "Thrikketta"),
        ("Moolam", "Moolam"),
        ("Pooradam", "Pooradam"),
        ("Uthradam", "Uthradam"),
        ("Thiruvonam", "Thiruvonam"),
        ("Avittam", "Avittam"),
        ("Chathayam", "Chathayam"),
        ("Pooruruttathi", "Pooruruttathi"),
        ("Uthruttathi", "Uthruttathi"),
        ("Revathi", "Revathi"),
    ]

    name = models.CharField(max_length=100)
    country_code = models.CharField(max_length=20)   # ✅ FIXED
    phone = models.CharField(max_length=20)
    nakshatra = models.CharField(max_length=50, choices=NAKSHATRA_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'country_code', 'phone'],  # ✅ FIXED
                name='unique_devotee'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.country_code}{self.phone}"

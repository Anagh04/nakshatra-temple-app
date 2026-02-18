from rest_framework import serializers
from .models import Devotee


class DevoteeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Devotee
        fields = "__all__"
        read_only_fields = ["created_at"]

    def validate(self, data):
        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()
        country_code = data.get("country_code", "").strip()

        if not name or not phone:
            raise serializers.ValidationError(
                {"error": "Name and phone are required."}
            )

        queryset = Devotee.objects.filter(
            name=name,
            country_code=country_code,   # ✅ FIXED
            phone=phone
        )

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError(
                {"error": "This devotee is already registered."}
            )

        return data

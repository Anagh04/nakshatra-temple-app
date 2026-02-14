from rest_framework import serializers
from .models import Devotee


class DevoteeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Devotee
        fields = "__all__"
        read_only_fields = ["created_at"]

    def validate(self, data):
        name = data.get("name")
        phone = data.get("phone")
        country_code = data.get("country_code")

        if self.instance:
            exists = Devotee.objects.filter(
                name=name,
                country_code=country_code,
                phone=phone
            ).exclude(id=self.instance.id).exists()
        else:
            exists = Devotee.objects.filter(
                name=name,
                country_code=country_code,
                phone=phone
            ).exists()

        if exists:
            raise serializers.ValidationError(
                {"error": "This devotee is already registered."}
            )

        return data

# Generated by Django 5.1.1 on 2024-12-12 03:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_product_info'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='priority',
            field=models.BooleanField(default=False, verbose_name='Priority'),
        ),
    ]
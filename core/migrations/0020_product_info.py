# Generated by Django 5.1.1 on 2024-12-09 06:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_sphotostatus_sretouchstatus_retouchrequest_priority_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='info',
            field=models.TextField(blank=True, null=True),
        ),
    ]

# Generated by Django 5.1.1 on 2024-11-27 07:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_strequesthistoryoperations_strequesthistory'),
    ]

    operations = [
        migrations.AlterField(
            model_name='strequesthistoryoperations',
            name='id',
            field=models.IntegerField(primary_key=True, serialize=False),
        ),
    ]

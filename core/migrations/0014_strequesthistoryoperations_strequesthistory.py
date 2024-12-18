# Generated by Django 5.1.1 on 2024-11-27 07:05

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_userurls'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='STRequestHistoryOperations',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='STRequestHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='request_history', to='core.product')),
                ('st_request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='core.strequest')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='request_operations', to=settings.AUTH_USER_MODEL)),
                ('operation', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='request_histories', to='core.strequesthistoryoperations')),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
    ]

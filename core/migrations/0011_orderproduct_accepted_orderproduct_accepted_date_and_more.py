# Generated by Django 5.1.1 on 2024-11-06 03:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_order_accept_date_order_accept_user_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderproduct',
            name='accepted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='orderproduct',
            name='accepted_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='orderproduct',
            name='assembled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='orderproduct',
            name='assembled_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
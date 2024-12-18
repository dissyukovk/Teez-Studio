# Generated by Django 5.1.1 on 2024-12-04 09:26

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_userprofile_on_work'),
    ]

    operations = [
        migrations.CreateModel(
            name='SPhotoStatus',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='SRetouchStatus',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.AddField(
            model_name='retouchrequest',
            name='priority',
            field=models.SmallIntegerField(default=3),
        ),
        migrations.AddField(
            model_name='retouchrequestproduct',
            name='comment',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='strequestproduct',
            name='comment',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='strequestproduct',
            name='sphoto_status',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.sphotostatus'),
        ),
        migrations.AddField(
            model_name='retouchrequestproduct',
            name='sretouch_status',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.sretouchstatus'),
        ),
    ]

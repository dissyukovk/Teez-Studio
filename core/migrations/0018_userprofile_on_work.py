# Generated by Django 5.1.1 on 2024-12-02 00:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_retouchrequeststatus_retouchrequest_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='on_work',
            field=models.BooleanField(default=False, verbose_name='Is On Work'),
        ),
    ]

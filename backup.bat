@echo off
REM Задаем пароль для pg_dump (замените *** на ваш реальный пароль)
set PGPASSWORD=vp3whbjvp8asd

REM Указываем каталог для сохранения бэкапов (убедитесь, что такая папка существует или будет создана)
set BACKUP_DIR=D:\backup\

REM Создаем каталог, если его нет
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Получаем текущую дату и время в формате, удобном для имени файла
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set dt=%%I
set YYYY=%dt:~0,4%
set MM=%dt:~4,2%
set DD=%dt:~6,2%
set HH=%dt:~8,2%
set Min=%dt:~10,2%
set SS=%dt:~12,2%

set FILE_NAME=myproject_%YYYY%-%MM%-%DD%_%HH%-%Min%-%SS%.sql

REM Выполняем резервное копирование с помощью pg_dump
pg_dump -U postgres -h localhost -p 5432 myproject > "%BACKUP_DIR%\%FILE_NAME%"

echo Backup completed: %BACKUP_DIR%\%FILE_NAME%
timeout /T 60 /NOBREAK

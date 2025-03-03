@echo off
rem Устанавливаем пароль
set PGPASSWORD=vp3whbjvp8asd

rem Вызываем pg_dump с полным путём
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" ^
  -U postgres ^
  -F c ^
  -b ^
  -v ^
  -f "D:\backup\myproject.backup" ^
  myproject

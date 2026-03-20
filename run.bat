@echo off
echo Starting CarBnb Admin System...
echo.
echo Make sure you have Node.js installed.
echo Make sure your local PostgreSQL is running at localhost:5432
echo and DATABASE_URL in .env points to your local database.
echo This window will start the Next.js development server.
echo.
cmd /c npm run dev
pause

@echo off
echo Starting Hexo blog deployment...

echo.
echo [1/3] Cleaning previous build...
call npm run clean

echo.
echo [2/3] Generating static files...
call npm run build

echo.
echo [3/3] Deployment completed!
echo Your blog has been built to the 'public' directory.
echo.
echo To deploy manually, push your changes to GitHub and the GitHub Actions will handle the rest.
echo.
pause
@echo off
cd /d "%~dp0"
title Deploy TLC reviews to GitHub Pages
set GIT_AUTHOR_NAME=tomc69-sys
set GIT_AUTHOR_EMAIL=tomc69-sys@users.noreply.github.com
set GIT_COMMITTER_NAME=tomc69-sys
set GIT_COMMITTER_EMAIL=tomc69-sys@users.noreply.github.com

"%LOCALAPPDATA%\Programs\Python\Python312\python.exe" tools\build_reviews.py
if errorlevel 1 (
  echo Rebuild failed.
  pause
  exit /b 1
)

git add reviews.html data/reviews-approved.json
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Publish approved customer reviews."
  git push origin HEAD
) else (
  echo No review changes to publish.
)
pause

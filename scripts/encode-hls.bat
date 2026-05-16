@echo off
REM ─────────────────────────────────────────────────────────────────
REM BIKAN HLS Encoder (Windows) — Konversi video ke HLS multi-bitrate
REM ─────────────────────────────────────────────────────────────────
REM Usage: scripts\encode-hls.bat <input_video> <lesson_slug>
REM Example: scripts\encode-hls.bat C:\Videos\pengantar.mp4 lesson-01-pengantar
REM
REM Prasyarat: FFmpeg terinstall
REM   Install: winget install ffmpeg
REM   Atau: choco install ffmpeg
REM ─────────────────────────────────────────────────────────────────

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

set INPUT=%~1
set SLUG=%~2
set OUTPUT_DIR=public\videos\%SLUG%

where ffmpeg >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] FFmpeg tidak ditemukan!
    echo   Install: winget install ffmpeg
    echo   Atau: choco install ffmpeg
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo.
echo  BIKAN HLS Encoder
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  Input:  %INPUT%
echo  Output: %OUTPUT_DIR%\
echo  Profiles: 360p (800k) ^| 540p (1.4M) ^| 720p (2.8M)
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo  Encoding... (ini bisa memakan waktu beberapa menit)
echo.

ffmpeg -i "%INPUT%" ^
  -preset fast ^
  -g 48 -sc_threshold 0 ^
  -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 ^
  -s:v:0 640x360 -b:v:0 800k -maxrate:v:0 856k -bufsize:v:0 1200k ^
  -s:v:1 960x540 -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k ^
  -s:v:2 1280x720 -b:v:2 2800k -maxrate:v:2 2996k -bufsize:v:2 4200k ^
  -c:v libx264 -crf 23 ^
  -c:a aac -b:a 128k -ac 2 ^
  -f hls ^
  -hls_time 6 ^
  -hls_playlist_type vod ^
  -hls_flags independent_segments ^
  -hls_segment_type mpegts ^
  -hls_segment_filename "%OUTPUT_DIR%\seg_%%v_%%03d.ts" ^
  -master_pl_name master.m3u8 ^
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" ^
  "%OUTPUT_DIR%\stream_%%v.m3u8"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Encoding gagal! Periksa input video.
    exit /b 1
)

echo.
echo  [OK] Encoding selesai!
echo.
echo  Gunakan URL berikut di lessons.ts:
echo    videoUrl: '/videos/%SLUG%/master.m3u8'
echo.
echo  File output:
dir /b "%OUTPUT_DIR%"
echo.
goto :eof

:usage
echo [ERROR] Usage: scripts\encode-hls.bat ^<input_video^> ^<lesson_slug^>
echo   Example: scripts\encode-hls.bat C:\Videos\pengantar.mp4 lesson-01-pengantar
exit /b 1

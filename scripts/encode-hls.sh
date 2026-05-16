#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# BIKAN HLS Encoder — Konversi video ke format HLS multi-bitrate
# ─────────────────────────────────────────────────────────────────
# Usage: bash scripts/encode-hls.sh <input_video> <lesson_slug>
# Example: bash scripts/encode-hls.sh ~/Videos/pengantar.mp4 lesson-01-pengantar
#
# Prasyarat: FFmpeg terinstall (https://ffmpeg.org/download.html)
# Windows: choco install ffmpeg / winget install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg
# ─────────────────────────────────────────────────────────────────

set -e

INPUT="$1"
SLUG="$2"

if [ -z "$INPUT" ] || [ -z "$SLUG" ]; then
  echo "❌ Usage: bash scripts/encode-hls.sh <input_video> <lesson_slug>"
  echo "   Example: bash scripts/encode-hls.sh video.mp4 lesson-01-pengantar"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "❌ FFmpeg tidak ditemukan. Install dulu:"
  echo "   Windows: winget install ffmpeg"
  echo "   Mac: brew install ffmpeg"
  echo "   Linux: sudo apt install ffmpeg"
  exit 1
fi

OUTPUT_DIR="public/videos/$SLUG"
mkdir -p "$OUTPUT_DIR"

echo "🎬 BIKAN HLS Encoder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Input:  $INPUT"
echo "📂 Output: $OUTPUT_DIR/"
echo "🎯 Profiles: 360p (800k) | 540p (1.4M) | 720p (2.8M)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── Encode multi-bitrate HLS ───
echo "⏳ Encoding... (ini bisa memakan waktu beberapa menit)"

ffmpeg -i "$INPUT" \
  -preset fast \
  -g 48 -sc_threshold 0 \
  -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 \
  -s:v:0 640x360  -b:v:0 800k  -maxrate:v:0 856k  -bufsize:v:0 1200k \
  -s:v:1 960x540  -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k \
  -s:v:2 1280x720 -b:v:2 2800k -maxrate:v:2 2996k -bufsize:v:2 4200k \
  -c:v libx264 -crf 23 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "$OUTPUT_DIR/seg_%v_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  "$OUTPUT_DIR/stream_%v.m3u8"

echo ""
echo "✅ Encoding selesai!"
echo ""
echo "📋 File yang dihasilkan:"
ls -lh "$OUTPUT_DIR/"
echo ""
echo "🔗 Gunakan URL berikut di lessons.ts:"
echo "   videoUrl: '/videos/$SLUG/master.m3u8'"
echo ""
echo "📦 Total size:"
du -sh "$OUTPUT_DIR/"

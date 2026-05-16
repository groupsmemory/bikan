# BIKAN Video Assets — HLS via Vercel Static CDN

## Arsitektur ($0 Free Tier)

Semua file video disimpan di folder ini sebagai segmen HLS.
Saat deploy ke Vercel, folder `public/` otomatis didistribusikan ke Edge CDN global — **gratis**.

## Cara Menambah Video Baru

### 1. Siapkan Video Asli
Pastikan video sudah dalam format MP4 (H.264). Durasi ideal: 3-12 menit (micro-learning).

### 2. Jalankan FFmpeg untuk Konversi ke HLS

```bash
# Dari root project, jalankan:
bash scripts/encode-hls.sh input.mp4 lesson-01-pengantar
```

Atau manual:

```bash
ffmpeg -i input.mp4 \
  -preset fast \
  -g 48 -sc_threshold 0 \
  -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 \
  -s:v:0 640x360 -b:v:0 800k -maxrate:v:0 856k -bufsize:v:0 1200k \
  -s:v:1 960x540 -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k \
  -s:v:2 1280x720 -b:v:2 2800k -maxrate:v:2 2996k -bufsize:v:2 4200k \
  -c:v libx264 -crf 23 -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "public/videos/lesson-01-pengantar/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  public/videos/lesson-01-pengantar/stream_%v.m3u8
```

### 3. Struktur Hasil

```
public/videos/lesson-01-pengantar/
├── master.m3u8          ← Entry point (adaptive bitrate)
├── stream_0.m3u8        ← 360p playlist
├── stream_1.m3u8        ← 540p playlist
├── stream_2.m3u8        ← 720p playlist
├── segment_000.ts       ← Video segments (~6 detik each)
├── segment_001.ts
└── ...
```

### 4. Referensi di Code

Di `src/data/lessons.ts`, gunakan path relatif:

```typescript
videoUrl: '/videos/lesson-01-pengantar/master.m3u8'
```

## Target Performa

| Metrik | Target | Cara Tercapai |
|--------|--------|---------------|
| Cold start | < 1.5 detik | Segmen 6 detik + Vercel Edge CDN |
| Adaptive bitrate | 3 level | 360p / 540p / 720p |
| Bandwidth hemat | ~50% vs MP4 | HLS progressive loading |

## Catatan Penting

- **JANGAN commit video besar ke Git!** Gunakan `.gitignore` untuk exclude `.ts` segments jika perlu.
- Untuk development, gunakan Apple/Mux test streams (sudah ada di `lessons.ts`).
- Untuk production, encode video asli dan commit hasilnya.
- Vercel Free Tier limit: 100GB bandwidth/bulan — cukup untuk ~500 siswa aktif.

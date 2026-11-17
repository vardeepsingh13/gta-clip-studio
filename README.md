# GTA Clip Studio — mobile website prototype

## Included
- Mobile-friendly website/PWA interface.
- Upload a locally saved video recording.
- Select multiple start/end ranges.
- Convert each selected range to 9:16 vertical MP4.
- Choose centre, upper or lower crop.
- All cutting/transcoding runs in the browser using FFmpeg.wasm.

## Important honest limitations
- This is a working manual clip cutter, NOT yet an AI viral-moment detector.
- It does not download Twitch/YouTube/Kick streams from URLs. Import a VOD/recording you own or are authorised to edit.
- It does not yet generate automatic speech captions, identify GTA highlight moments, or make AI hooks. Those are the next development phase.
- FFmpeg.wasm is resource-intensive. Long/high-resolution recordings can exceed iPhone Safari memory limits. For best results, start with a shorter 720p/1080p recording and export a few clips at a time.
- First load downloads the FFmpeg WebAssembly engine and requires internet. Video processing itself is local.
- This uses a single-thread browser engine for compatibility; performance will be slower than native FFmpeg.

## Deploy free
1. Create a GitHub account and a new public repository.
2. Upload `index.html`, `app.js`, `manifest.webmanifest`, and `README.md`.
3. In repository Settings -> Pages, deploy from the main branch/root.
4. Open the resulting HTTPS GitHub Pages URL in Safari on iPhone.
5. Share -> Add to Home Screen.

GitHub Pages is free for public repositories, but it has usage limits and terms. See GitHub's official docs:
https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Libraries
- FFmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm
- License and third-party notices should be checked before public redistribution.


---
Task ID: ad-cleanup-1
Agent: main
Task: Hapus iklan AdsTerra (AdNative/AdPopunder) dari seluruh project

Work Log:
- Grep seluruh folder src untuk referensi adsterra/AdNative/AdPopunder/AdBanner/popunder
- Hapus import & usage AdPopunder dari src/app/layout.tsx (import + <AdPopunder/>)
- Hapus import AdNative, variable adRefreshKey, dan 2x AdNative usage dari src/components/HomePage.tsx
- Hapus import AdNative dan 3x AdNative usage dari src/components/VideoPlayer.tsx
- Hapus import AdNative dan 3x AdNative usage dari src/app/video/[slug]/page.tsx
- Hapus file src/components/AdBanner.tsx sepenuhnya
- Verifikasi: grep ulang -> 0 referensi tersisa di src/
- jalankan `bun run lint` -> lulus tanpa error
- Cek dev.log -> server tetap running, semua route 200

Stage Summary:
- Semua kode iklan AdsTerra (Native Banner & Popunder) telah dihapus total dari aplikasi aktif
- File komponen AdBanner.tsx dihapus
- Tidak ada script AdsTerra (theoreticalassertshame.com / pl29423497.profitablecpmratenetwork.com) yang dimuat lagi di mana pun
- Folder upload/youfet-main-extracted/ sengaja dibiarkan (cadangan asli, bukan kode aktif)
- Lint lulus, dev server sehat

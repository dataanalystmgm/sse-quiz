export const stockQuestions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  question: `[SSE-Stock Management] Pertanyaan ${i + 1}: Untuk menjaga keandalan Stock Visibility (Akurasi Data 100%), apa langkah krusial yang diamanatkan dalam SOP komparasi stok fisik?`,
  options: [
    "Melakukan sinkronisasi data real-time atas ketersediaan CPT & FG di sistem internal dengan platform visibilitas digital customer",
    "Mencatat mutasi barang keluar masuk gudang menggunakan buku log fisik tanpa input digital",
    "Menolak proses audit internal demi menjaga kecepatan operasional harian staff gudang",
    "Menghapus data selisih stok (variance) agar performa akurasi laporan di dasbor terlihat sempurna"
  ],
  answer: "Melakukan sinkronisasi data real-time atas ketersediaan CPT & FG di sistem internal dengan platform visibilitas digital customer"
}));

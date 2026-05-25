export const planningQuestions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  question: `[SSE-Planning] Pertanyaan ${i + 1}: Dalam pilar Production Planning, bagaimana cara mendeteksi kapasitas makro (Macro Capacity Piloting) agar koheren dengan fluktuasi demand musiman?`,
  options: [
    "Menyusun perencanaan kapasitas berkala menggunakan data riwayat pemesanan Year N dan proyeksi N+2",
    "Hanya memproduksi barang ketika pesanan resmi (Purchase Order) dirilis oleh pembeli",
    "Menambah jam kerja lembur karyawan secara mendadak saat target pengiriman harian meleset",
    "Membuat perkiraan produksi berdasarkan intuisi tim supervisor gudang komponen"
  ],
  answer: "Menyusun perencanaan kapasitas berkala menggunakan data riwayat pemesanan Year N dan proyeksi N+2"
}));
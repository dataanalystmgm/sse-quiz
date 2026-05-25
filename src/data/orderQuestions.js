export const orderQuestions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  question: `[SSE-Order] Pertanyaan ${i + 1}: Bagaimana mekanisme validasi supply method yang ideal antara supplier dan Supplier Supply Leader (SPL) sebelum musim produksi dimulai?`,
  options: [
    "Melakukan review status pemesanan model secara kolaboratif serta memetakan skema transisi model (range change)",
    "Membebankan seluruh keputusan metode pengiriman kepada pihak ekspedisi komersial",
    "Mengubah jadwal pengiriman secara sepihak lewat pesan instan tanpa konfirmasi sistem ERP",
    "Mengabaikan model akhir siklus hidup (end of life) hingga stok menumpuk di gudang"
  ],
  answer: "Melakukan review status pemesanan model secara kolaboratif serta memetakan skema transisi model (range change)"
}));
export const supplyQuestions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  question: `[SSE-Supply] Pertanyaan ${i + 1}: Apa fokus utama dari pilar Supply Chain Collaboration & Strategy pada SSE Grid dalam mengukur level autonomi supplier?`,
  options: [
    "Sinkronisasi strategi S&OP jangka panjang secara end-to-end antara pabrik dan customer zone",
    "Peningkatan kapasitas mesin pemotong otomatis secara parsial di lini produksi tanpa integrasi",
    "Melakukan verifikasi data inventaris secara manual setahun sekali saat stock opname",
    "Menyalin seluruh kebijakan logistik pihak ketiga secara mentah tanpa KPI lokal"
  ],
  answer: "Sinkronisasi strategi S&OP jangka panjang secara end-to-end antara pabrik dan customer zone"
}));
// src/History.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function History({ currentEmpId, googleSheetUrl, onBack }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState(currentEmpId || '');

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(googleSheetUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Gagal memuat histori Google Sheet:", error);
      // Data Cadangan Sementara jika Apps Script Anda sedang offline
      setHistoryData([
        { id: 'row-1', timestamp: '25/05/2026 09:15', employeeId: 'MGM 4329', name: 'Operator Tester', division: 'PPIC', score: '45', version: 'SSE-Supply', isTrainerValidated: false },
        { id: 'row-2', timestamp: '25/05/2026 10:30', employeeId: 'MGM 4329', name: 'Operator Tester', division: 'PPIC', score: '68', version: 'SSE-Planning', isTrainerValidated: false },
        { id: 'row-3', timestamp: '25/05/2026 11:12', employeeId: 'MGM 4329', name: 'Operator Tester', division: 'PPIC', score: '85', version: 'SSE-Stock Management', isTrainerValidated: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Logika Kriteria Penilaian Status & Suggestion
  const parseEvaluation = (score, isTrainerValidated) => {
    if (isTrainerValidated) {
      return {
        status: "Pass dengan Level skill 100% (Certified Trainer)",
        statusClass: "bg-purple-100 text-purple-800 border-purple-200",
        suggestion: "Otoritas Penuh Diberikan. Anda sekarang berwenang melakukan coaching operasional lapangan dan memvalidasi keahlian kru operator lain.",
        suggestClass: "bg-purple-50 text-purple-700 border-purple-100"
      };
    }

    const num = parseInt(score) || 0;

    if (num >= 0 && num <= 50) {
      return {
        status: "Gagal / Failed",
        statusClass: "bg-red-100 text-red-800 border-red-200",
        suggestion: "❌ Saran Tindakan: Nilai kompetensi Anda belum mencukupi. Anda diwajibkan menjadwalkan sesi pelatihan ulang (RE-TRAINING) dengan Leader Anda.",
        suggestClass: "bg-red-50 text-red-700 border-red-100"
      };
    } else if (num >= 51 && num <= 70) {
      return {
        status: "Pass dengan Level skill 50%",
        statusClass: "bg-amber-100 text-amber-800 border-amber-200",
        suggestion: "💡 Saran Tindakan: Anda lulus dasar. Disarankan meningkatkan pemahaman harian di area kerja serta silakan mengambil tes ulang (RE-TEST) untuk naik grade.",
        suggestClass: "bg-amber-50 text-amber-700 border-amber-100"
      };
    } else {
      return {
        status: "Pass dengan Level skill 75%",
        statusClass: "bg-green-100 text-green-800 border-green-200",
        suggestion: "🌟 Saran Tindakan: Hasil luar biasa! Langkah berikutnya silakan ajukan tinjauan Gemba bersama Senior Trainer untuk divalidasi kualifikasinya menjadi 100% (Trainer).",
        suggestClass: "bg-green-50 text-green-700 border-green-100"
      };
    }
  };

  // Fungsi Proteksi Password Trainer untuk Mengubah Level Skill Karyawan ke 100%
  const handleValidateSkill = (targetId) => {
    Swal.fire({
      title: 'Otorisasi Senior Trainer',
      text: 'Masukkan password verifikasi untuk memvalidasi pencapaian operator ini ke Level Kompetensi 100% (Trainer):',
      input: 'password',
      inputPlaceholder: 'Ketik password khusus trainer...',
      showCancelButton: true,
      confirmButtonText: 'Validasi Skill',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#7c3aed', 
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        if (result.value === "akutrainermu") {
          // Mutasi State frontend secara real-time demi pengalaman pengguna yang responsif
          setHistoryData(prev => prev.map(item => 
            item.id === targetId ? { ...item, isTrainerValidated: true } : item
          ));

          Swal.fire({
            icon: 'success',
            title: 'Sertifikasi Disetujui!',
            text: 'Tingkat kompetensi operator sukses ditingkatkan menjadi Level 100% (Trainer).',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Validasi Gagal',
            text: 'Password Salah! Anda tidak memiliki hak akses otentikasi kualifikasi.',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const dataFiltered = historyData.filter(item => 
    item.employeeId.toLowerCase().includes(searchId.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-slate-900 text-white shadow-md py-5 px-4 mb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-amber-400">📊 Pangkalan Histori Skor Khas Google Sheet</h1>
            <p className="text-xs text-slate-400">Monitoring Pemetaan Matriks Kualifikasi dan Validasi Kelulusan Karyawan</p>
          </div>
          <button onClick={onBack} className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-600 transition-colors">
            &larr; Kembali ke Menu Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Filter Cari NIK / ID Karyawan</label>
            <input 
              type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)}
              placeholder="Contoh: MGM 4329..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-800"
            />
          </div>
          <button onClick={fetchHistoryData} disabled={loading} className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold h-11 px-5 rounded-xl border border-blue-200 transition-colors">
            {loading ? 'Sinkronisasi...' : '🔄 Segarkan Data'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm font-medium text-slate-500">Menarik data lembar kelulusan dari Cloud Google Sheet...</p>
          </div>
        ) : dataFiltered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border text-slate-400 text-sm italic">
            Tidak ditemukan rekaman histori pengerjaan kuis untuk ID: "{searchId}"
          </div>
        ) : (
          <div className="space-y-4">
            {dataFiltered.map((item) => {
              const evalInfo = parseEvaluation(item.score, item.isTrainerValidated);
              return (
                <div key={item.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${item.isTrainerValidated ? 'border-purple-300 bg-purple-50/5' : 'border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 mb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{item.employeeId}</span>
                        <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                        <span className="text-xs text-slate-400">[{item.division}]</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-700 mt-1">📌 {item.version} • <span className="text-slate-400 font-normal text-xs">{item.timestamp}</span></h4>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Skor</span>
                      <strong className="text-2xl font-black text-slate-900">{item.score}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Status:</span>
                        <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${evalInfo.statusClass}`}>{evalInfo.status}</span>
                      </div>
                      <div className={`text-xs p-3 rounded-xl border leading-relaxed font-medium ${evalInfo.suggestClass}`}>{evalInfo.suggestion}</div>
                    </div>
                    <div className="md:col-span-4 flex justify-end w-full">
                      {item.isTrainerValidated ? (
                        <div className="w-full text-center bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm">
                          🛡️ Verified By Senior Trainer
                        </div>
                      ) : (
                        parseInt(item.score) >= 71 ? (
                          <button onClick={() => handleValidateSkill(item.id)} className="w-full bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white text-xs font-extrabold px-4 py-2.5 rounded-xl border border-purple-200 transition-all shadow-sm">
                            ✍️ Validated by Trainer
                          </button>
                        ) : (
                          <button disabled className="w-full bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 cursor-not-allowed opacity-50">
                            🔒 Validated by Trainer
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
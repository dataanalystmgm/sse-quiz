// src/App.jsx
import React, { useState, useEffect } from 'react';
import { INITIAL_MODULES } from './initialData';
import Swal from 'sweetalert2'; // <--- IMPORT SWEETALERT2
import History from './History';

export default function App() {
  // URL Deployment Web App Google Apps Script Anda
  const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyqoqeiKdUqPsKHkI2Qg8QjN-QzLljceKczZz0J626Uoj5hMdl2QkFKZqj_xNJuXZ6aMw/exec";

  // State Utama
  const [modules, setModules] = useState(() => {
    const saved = localStorage.getItem('mgm_quiz_modules');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
  });

  // Sinkronisasi data ke LocalStorage
  useEffect(() => {
    localStorage.setItem('mgm_quiz_modules', JSON.stringify(modules));
  }, [modules]);

  // State Navigasi Halaman
  const [viewMode, setViewMode] = useState('quiz'); // 'quiz' atau 'history'

  // State Profil Pengguna
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('mgm_user_profile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  const [inputName, setInputName] = useState('');
  const [inputEmpId, setInputEmpId] = useState('');

  // State Pilihan Divisi Dinamis
  const [divisionOptions, setDivisionOptions] = useState(() => {
    const savedOptions = localStorage.getItem('mgm_division_options');
    return savedOptions ? JSON.parse(savedOptions) : [
      "Merchandiser",
      "PPIC",
      "Material Warehouse",
      "Finish Good Warehouse",
      "Purchasing",
      "Logistics"
    ];
  });
  const [inputDivision, setInputDivision] = useState(divisionOptions[0] || 'Merchandiser');
  const [customDivision, setCustomDivision] = useState('');
  const [isOthers, setIsOthers] = useState(false);

  // State Kontrol Ujian
  const [currentModuleKey, setCurrentModuleKey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);

  // State Kontrol Mode CRUD
  const [isCrudMode, setIsCrudMode] = useState(false);
  const [crudModuleKey, setCrudModuleKey] = useState('supply');
  const [editingQuestion, setEditingQuestion] = useState(null);

  // State Form Input CRUD Soal
  const [formQ, setFormQ] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrect, setFormCorrect] = useState(0);
  const [formScore, setFormScore] = useState(2); // State Bobot Skor (Default: 2)

  // ================= TAMPILAN INTERMEDIATE: MENU HISTORI NILAI GOOGLE SHEET =================
  if (viewMode === 'history') {
    return (
      <History 
        currentEmpId={userProfile?.empId}
        googleSheetUrl={GOOGLE_SHEET_WEBAPP_URL}
        onBack={() => setViewMode('quiz')}
      />
    );
  }

  // ================= SWEETALERT CONTROL FUNCTIONS =================
  const handleEnterCrudMode = () => {
    Swal.fire({
      title: 'Akses Terbatas Administrator',
      text: 'Masukkan password otentikasi untuk mengelola bank data soal:',
      input: 'password',
      inputPlaceholder: 'Ketik password khusus admin...',
      showCancelButton: true,
      confirmButtonText: 'Verifikasi Otoritas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        if (result.value === "sseakubisa") {
          Swal.fire({
            icon: 'success',
            title: 'Otoritas Diterima',
            text: 'Anda masuk ke pusat pengaturan database soal.',
            timer: 1500,
            showConfirmButton: false
          });
          setIsCrudMode(true);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak',
            text: 'Password yang Anda masukkan salah!',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Ganti Identitas?',
      text: "Sesi kuis yang sedang berjalan akan dibersihkan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar Sesi',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setUserProfile(null);
        localStorage.removeItem('mgm_user_profile');
        setCurrentModuleKey(null);
        setAnswers({});
        setShowResult(false);
      }
    });
  };

  const handleResetToDefault = () => {
    Swal.fire({
      title: 'Atur Ulang ke Default?',
      text: "Seluruh perubahan teks soal, penambahan soal, dan custom skor akan dihapus total kembali ke bawaan pabrik!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Reset Total'
    }).then((result) => {
      if (result.isConfirmed) {
        setModules(INITIAL_MODULES);
        resetCrudForm();
        Swal.fire(
          'Berhasil!',
          'Seluruh bank data soal dan skor telah dikembalikan ke bawaan awal.',
          'success'
        );
      }
    });
  };

  // ================= LOGIKA HITUNG SKOR DINAMIS BERDASARKAN BOBOT SOAL =================
  const calculateResult = () => {
    if (!currentModuleKey) return { correctCount: 0, score: 0 };
    
    const activeQuestions = modules[currentModuleKey].questions;
    let correctCount = 0;
    let totalEarnedScore = 0;
    let totalPossibleScore = 0;

    activeQuestions.forEach((q) => {
      const questionWeight = q.score !== undefined ? parseInt(q.score) : 2; // Jika belum ada properti skor, pakai default 2
      totalPossibleScore += questionWeight;

      if (answers[q.id] === q.correct) {
        correctCount++;
        totalEarnedScore += questionWeight;
      }
    });

    // Konversi hasil ke nilai skala 100
    const finalScore = totalPossibleScore > 0 ? Math.round((totalEarnedScore / totalPossibleScore) * 100) : 0;
    return { correctCount, score: finalScore };
  };

  const submitToGoogleSheet = async (finalScore) => {
    setIsSubmittingSheet(true);
    Swal.fire({
      title: 'Mengarsipkan Lembar Jawaban',
      html: 'Sedang mensinkronisasikan nilai kompetensi Anda ke Cloud Database Google Sheets...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const payload = {
      timestamp: new Date().toLocaleString('id-ID'),
      name: userProfile.name,
      employeeId: userProfile.empId,
      division: userProfile.division,
      score: finalScore,
      version: modules[currentModuleKey].title
    };

    const activeQuestions = modules[currentModuleKey].questions;
    for (let i = 1; i <= 50; i++) {
      const currentQuestion = activeQuestions[i - 1];
      if (currentQuestion) {
        const userAnswerIndex = answers[currentQuestion.id];
        payload[`jawaban_${i}`] = userAnswerIndex !== undefined ? String.fromCharCode(65 + userAnswerIndex) : "-";
      } else {
        payload[`jawaban_${i}`] = "N/A";
      }
    }

    try {
      await fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      Swal.fire({
        icon: 'success',
        title: 'Sertifikasi Selesai!',
        text: 'Lembar kerja Anda berhasil disimpan ke cloud arsip.',
        confirmButtonColor: '#16a34a'
      });
      setShowResult(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Koneksi Terganggu',
        text: 'Gagal mengirim nilai otomatis. Hasil tetap ditampilkan di layar.',
        confirmButtonColor: '#2563eb'
      });
      setShowResult(true);
    } finally {
      setIsSubmittingSheet(false);
    }
  };

  const handleConfirmSubmit = (score, answeredCount, totalQuestions) => {
    Swal.fire({
      title: 'Kirim Jawaban Sekarang?',
      text: answeredCount < totalQuestions 
        ? `Perhatian: Anda baru mengisi ${answeredCount} dari ${totalQuestions} soal kuis yang tersedia.` 
        : "Seluruh pertanyaan telah terisi. Pastikan Anda telah memeriksa ulang pilihan jawaban.",
      icon: answeredCount < totalQuestions ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Selesai Ujian',
      cancelButtonText: 'Periksa Kembali'
    }).then((result) => {
      if (result.isConfirmed) {
        submitToGoogleSheet(score);
      }
    });
  };

  // ================= HANDLER OPERASI CRUD DATABASE SOAL =================
  const startEditQuestion = (q) => {
    setEditingQuestion(q);
    setFormQ(q.q);
    setFormOptA(q.options[0] || '');
    setFormOptB(q.options[1] || '');
    setFormOptC(q.options[2] || '');
    setFormOptD(q.options[3] || '');
    setFormCorrect(q.correct);
    setFormScore(q.score !== undefined ? q.score : 2); // Mengisi nilai form dari properti soal, default 2
  };

  const resetCrudForm = () => {
    setEditingQuestion(null);
    setFormQ('');
    setFormOptA('');
    setFormOptB('');
    setFormOptC('');
    setFormOptD('');
    setFormCorrect(0);
    setFormScore(2); // Reset form kembali ke default 2
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!formQ || !formOptA || !formOptB || !formOptC || !formOptD) {
      Swal.fire('Form Kosong', 'Harap isi seluruh rumusan pertanyaan dan 4 opsi jawaban!', 'warning');
      return;
    }

    const updatedQuestions = [...modules[crudModuleKey].questions];

    if (editingQuestion) {
      const index = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        updatedQuestions[index] = {
          ...editingQuestion,
          q: formQ,
          options: [formOptA, formOptB, formOptC, formOptD],
          correct: parseInt(formCorrect),
          score: parseInt(formScore) || 2 // Menyimpan nilai bobot skor hasil edit
        };
      }
    } else {
      const nextId = updatedQuestions.length > 0 ? Math.max(...updatedQuestions.map(q => q.id)) + 1 : 1;
      updatedQuestions.push({
        id: nextId,
        q: formQ,
        options: [formOptA, formOptB, formOptC, formOptD],
        correct: parseInt(formCorrect),
        score: parseInt(formScore) || 2 // Menyimpan bobot skor untuk soal baru
      });
    }

    setModules({
      ...modules,
      [crudModuleKey]: {
        ...modules[crudModuleKey],
        questions: updatedQuestions
      }
    });

    Swal.fire('Berhasil Disimpan!', 'Data pertanyaan beserta bobot skor berhasil diperbarui.', 'success');
    resetCrudForm();
  };

  const handleDeleteQuestion = (id) => {
    Swal.fire({
      title: 'Hapus Pertanyaan?',
      text: "Tindakan ini akan membuang soal dari database permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Soal',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        const filteredQuestions = modules[crudModuleKey].questions.filter(q => q.id !== id);
        setModules({
          ...modules,
          [crudModuleKey]: {
            ...modules[crudModuleKey],
            questions: filteredQuestions
          }
        });
        if (editingQuestion && editingQuestion.id === id) {
          resetCrudForm();
        }
        Swal.fire('Terhapus!', 'Soal berhasil dibuang.', 'success');
      }
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputEmpId.trim()) {
      Swal.fire('Lengkapi Form!', 'Nama Lengkap dan NIK/ID Pekerja wajib diisi.', 'warning');
      return;
    }

    let finalDivision = inputDivision;
    if (isOthers) {
      if (!customDivision.trim()) {
        Swal.fire('Lengkapi Form!', 'Silakan isi nama divisi kustom Anda.', 'warning');
        return;
      }
      finalDivision = customDivision.trim();
      
      if (!divisionOptions.includes(finalDivision)) {
        const updatedOptions = [...divisionOptions, finalDivision];
        setDivisionOptions(updatedOptions);
        localStorage.setItem('mgm_division_options', JSON.stringify(updatedOptions));
      }
    }

    const profile = {
      name: inputName.trim(),
      empId: inputEmpId.trim(),
      division: finalDivision
    };
    setUserProfile(profile);
    localStorage.setItem('mgm_user_profile', JSON.stringify(profile));

    setCustomDivision('');
    setIsOthers(false);
  };

  // Menghitung hasil kuis secara real-time
  const { correctCount, score } = calculateResult();

  // ================= TAMPILAN 1: PANEL CRUD (MANAGEMENT MODE) =================
  if (isCrudMode) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        <header className="bg-slate-800 text-white p-4 shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-amber-400">⚙️ SSE Database Control Center</h1>
            <p className="text-xs text-slate-400">Kelola Bank Data Soal Kuis & Bobot Nilai Secara Real-Time</p>
          </div>
          <button
            onClick={() => { setIsCrudMode(false); resetCrudForm(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            &larr; Kembali Ke Dashboard Kuis
          </button>
        </header>

        <div className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sisi Kiri: Form Input Data Soal */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-bold border-b pb-2 mb-4 text-slate-900">
              {editingQuestion ? '✏️ Ubah Detil Pertanyaan' : '➕ Tambah Soal Baru'}
            </h2>
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pilih Modul Tujuan</label>
                <select 
                  disabled={editingQuestion !== null}
                  value={crudModuleKey} 
                  onChange={(e) => { setCrudModuleKey(e.target.value); resetCrudForm(); }}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-sm font-semibold text-slate-700 focus:outline-blue-500"
                >
                  <option value="supply">SSE-Supply</option>
                  <option value="planning">SSE-Planning</option>
                  <option value="order">SSE-Order</option>
                  <option value="stock">SSE-Stock Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Teks Rumusan Pertanyaan</label>
                <textarea 
                  rows="3" value={formQ} onChange={(e) => setFormQ(e.target.value)}
                  placeholder="Ketik deskripsi pertanyaan kuis..."
                  className="w-full bg-slate-50 border rounded-lg p-2.5 text-sm focus:outline-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-500">Opsi Pilihan Jawaban</label>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-xs font-bold px-2.5 py-2 rounded-lg">A</span>
                  <input type="text" value={formOptA} onChange={(e) => setFormOptA(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-sm focus:outline-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-xs font-bold px-2.5 py-2 rounded-lg">B</span>
                  <input type="text" value={formOptB} onChange={(e) => setFormOptB(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-sm focus:outline-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-xs font-bold px-2.5 py-2 rounded-lg">C</span>
                  <input type="text" value={formOptC} onChange={(e) => setFormOptC(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-sm focus:outline-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-xs font-bold px-2.5 py-2 rounded-lg">D</span>
                  <input type="text" value={formOptD} onChange={(e) => setFormOptD(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-sm focus:outline-blue-500" />
                </div>
              </div>

              {/* GRID BARU UNTUK KUNCI JAWABAN DAN EDIT BOBOT SKOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kunci Jawaban Benar</label>
                  <select 
                    value={formCorrect} 
                    onChange={(e) => setFormCorrect(parseInt(e.target.value))}
                    className="w-full bg-green-50 border border-green-300 rounded-lg p-2 text-sm font-bold text-green-800 focus:outline-green-600"
                  >
                    <option value={0}>Opsi A Benar</option>
                    <option value={1}>Opsi B Benar</option>
                    <option value={2}>Opsi C Benar</option>
                    <option value={3}>Opsi D Benar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-600 mb-1">🎯 Bobot Skor Soal</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formScore} 
                    onChange={(e) => setFormScore(Math.max(1, parseInt(e.target.value) || 1))} 
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-lg p-2 text-sm font-bold text-amber-900 focus:outline-amber-600" 
                    placeholder="Default 2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-lg shadow transition-colors">
                  {editingQuestion ? 'Simpan Perubahan' : 'Masukkan ke Basis Data'}
                </button>
                {editingQuestion && (
                  <button 
                    type="button" onClick={resetCrudForm}
                    className="bg-slate-400 hover:bg-slate-500 text-white text-sm px-4 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 border-t pt-4">
              <button 
                type="button" onClick={handleResetToDefault}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs py-2 rounded-lg transition-colors border border-red-200"
              >
                🚨 Atur Ulang Semua Modul ke Default (Pabrikan)
              </button>
            </div>
          </div>

          {/* Sisi Kanan: Daftar Tabel Pertanyaan Berjalan */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-lg font-bold text-slate-900">📋 Daftar Pertanyaan Aktif ({modules[crudModuleKey].questions.length} item)</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-mono px-2.5 py-1 rounded-full font-bold uppercase">{crudModuleKey}</span>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {modules[crudModuleKey].questions.length === 0 ? (
                <p className="text-slate-400 text-center py-12 text-sm italic">Belum ada pertanyaan di modul ini.</p>
              ) : (
                modules[crudModuleKey].questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 hover:bg-slate-100/60 transition-colors">
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 mb-1">
                        <span>ID-SOAL: #{q.id} • Urutan: {idx + 1}</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-sans">Skor: {q.score !== undefined ? q.score : 2} pts</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed mb-2">{q.q}</p>
                      <ul className="text-xs space-y-1 text-slate-600 pl-4 list-disc">
                        <li className={q.correct === 0 ? "text-green-600 font-bold" : ""}>A: {q.options[0]}</li>
                        <li className={q.correct === 1 ? "text-green-600 font-bold" : ""}>B: {q.options[1]}</li>
                        <li className={q.correct === 2 ? "text-green-600 font-bold" : ""}>C: {q.options[2]}</li>
                        <li className={q.correct === 3 ? "text-green-600 font-bold" : ""}>D: {q.options[3]}</li>
                      </ul>
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-2 mt-1">
                      <button 
                        onClick={() => startEditQuestion(q)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
                      >
                        ✏️ Edit Teks & Skor
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-md border border-red-200 transition-colors"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN 2: AUTENTIKASI MASUK PERTAMA (LOGIN) =================
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white text-center">
            <h1 className="text-xl font-bold tracking-wide">MGM E-Learning System</h1>
            <p className="text-blue-100 text-xs mt-1">Form Pengisian Identitas Pengguna Sebelum Ujian</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nama Lengkap Pekerja</label>
              <input 
                type="text" required value={inputName} onChange={(e) => setInputName(e.target.value)}
                placeholder="Masukkan nama lengkap sesuai ID Card..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Pengguna / NIK Karyawan</label>
              <input 
                type="text" required value={inputEmpId} onChange={(e) => setInputEmpId(e.target.value)}
                placeholder="Contoh: MGM 4329..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lini Bagian / Divisi Kerja</label>
              <select 
                value={isOthers ? "Others" : inputDivision} 
                onChange={(e) => {
                  if (e.target.value === "Others") {
                    setIsOthers(true);
                  } else {
                    setIsOthers(false);
                    setInputDivision(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
              >
                {divisionOptions.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
                <option value="Others">✨ Others / Divisi Lainnya (Isi Manual)</option>
              </select>

              {isOthers && (
                <div className="animate-fadeIn">
                  <input 
                    type="text" required value={customDivision} onChange={(e) => setCustomDivision(e.target.value)}
                    placeholder="Ketik nama Divisi baru Anda di sini..."
                    className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm mt-2 flex items-center justify-center gap-1"
            >
              Masuk Ke Dashboard &rarr;
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
              <button 
                type="button" onClick={handleEnterCrudMode}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors"
              >
                ⚙️ Mode Akses Administrator (Kelola Bank Soal)
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN 3: MENU UTAMA SELEKSI MODUL =================
  if (!currentModuleKey) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <header className="bg-blue-600 text-white shadow-md py-6 px-4 mb-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">MGM - SSE Competency Program</h1>
              <p className="text-blue-100 text-sm mt-1">Portal untuk melakukan pengukuran kompetensi yang berhubungan dengan SSE</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* === TOMBOL MENU HISTORI SHEET === */}
              <button
                onClick={() => setViewMode('history')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md border border-blue-400 flex items-center gap-1"
              >
                📊 Lihat Histori
              </button>

              <button 
                onClick={handleEnterCrudMode}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md border border-amber-400"
              >
                ⚙️ Kelola Soal
              </button>
              
              <div className="bg-blue-700 px-4 py-2.5 rounded-xl text-xs flex flex-col border border-blue-500 text-right font-medium">
                <span className="font-bold text-amber-300 font-mono">{userProfile.empId}</span>
                <span className="text-[10px] text-blue-200 truncate max-w-[140px]">{userProfile.name}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl text-xs font-bold"
              >
                🚪 Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-8">
            <h2 className="text-xl font-semibold mb-2">Selamat Datang di Portal Pengukuran Kompetensi</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Silakan pilih salah satu modul di bawah ini untuk memulai evaluasi pemahaman Anda mengenai SSE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(modules).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-200">
                      Modul Aktif
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{value.questions.length} Pertanyaan</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{value.desc}</p>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                  <button 
                    disabled={value.questions.length === 0}
                    onClick={() => { setCurrentModuleKey(key); setAnswers({}); setShowResult(false); }}
                    className={`w-full md:w-auto font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm ${
                      value.questions.length === 0 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {value.questions.length === 0 ? 'Soal Kosong' : 'Mulai Ujian \u2192'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ================= TAMPILAN 4: LEMBAR PENGERJAAN KUIS SOAL =================
  const moduleData = modules[currentModuleKey];
  const totalQuestions = moduleData.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Sticky Top Navigation */}
      <div className="sticky top-0 bg-white border-b border-slate-200 shadow-sm z-50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentModuleKey(null)}
              className="text-slate-500 hover:text-slate-800 font-semibold text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              &larr; Keluar
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">{moduleData.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Kemajuan Pengisian: {answeredCount} dari {totalQuestions} Soal Terjawab</p>
            </div>
          </div>
          
          {!showResult ? (
            <button 
              disabled={isSubmittingSheet}
              onClick={() => handleConfirmSubmit(score, answeredCount, totalQuestions)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-2 rounded-lg shadow transition-colors disabled:opacity-40"
            >
              {isSubmittingSheet ? "💾 Menyimpan..." : "Kirim Jawaban Evaluasi"}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentModuleKey(null)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2 rounded-lg shadow transition-colors"
            >
              Selesai & Menu Utama
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Banner Hasil Kelulusan Ujian */}
        {showResult && (
          <div className="bg-white rounded-2xl shadow-md border-2 border-blue-500 p-6 mb-8 text-center animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Lembar Hasil Sertifikasi Anda</h2>
            <p className="text-sm text-slate-500 mb-4">Profil Penilai: {userProfile.empId} — {userProfile.name} ({userProfile.division})</p>
            
            <div className="inline-flex flex-col items-center justify-center bg-slate-50 rounded-full w-32 h-32 border-4 border-blue-600 mb-4 shadow-inner">
              <span className="text-4xl font-extrabold text-blue-700">{score}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Skor Akhir (Skala 100)</span>
            </div>

            <div className="max-w-md mx-auto grid grid-cols-2 gap-4 text-sm mt-2">
              <div className="bg-green-50 text-green-800 rounded-lg p-3 border border-green-200">
                <span className="block text-xs font-semibold text-green-600 uppercase">Benar</span>
                <strong className="text-lg font-bold">{correctCount} / {totalQuestions} Soal</strong>
              </div>
              <div className="bg-red-50 text-red-800 rounded-lg p-3 border border-red-200">
                <span className="block text-xs font-semibold text-red-600 uppercase">Salah / Kosong</span>
                <strong className="text-lg font-bold">{totalQuestions - correctCount} Soal</strong>
              </div>
            </div>
          </div>
        )}

        {/* Render List Daftar Kuesioner */}
        <div className="space-y-6">
          {moduleData.questions.map((item, index) => {
            const isUserAnswered = answers[item.id] !== undefined;
            const userAnswerIndex = answers[item.id];
            const isCorrect = userAnswerIndex === item.correct;
            const itemScoreWeight = item.score !== undefined ? item.score : 2; // Menampilkan bobot nilai soal aktif

            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border p-6 transition-all ${
                  showResult 
                    ? isCorrect 
                      ? 'border-green-500 bg-green-50/10' 
                      : 'border-red-300 bg-red-50/10'
                    : isUserAnswered 
                      ? 'border-blue-300 shadow-sm' 
                      : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-slate-100 text-slate-700 font-mono text-sm font-bold px-2.5 py-1 rounded-md border border-slate-200">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-relaxed pt-0.5">{item.q}</h3>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded-md border whitespace-nowrap">
                    Bobot: {itemScoreWeight} pts
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 ml-10">
                  {item.options.map((option, optIdx) => {
                    const isSelected = userAnswerIndex === optIdx;
                    const isRightAnswer = item.correct === optIdx;

                    let btnStyle = "border-slate-200 hover:bg-slate-50 text-slate-700 bg-white";
                    if (!showResult) {
                      if (isSelected) btnStyle = "border-blue-600 bg-blue-50 text-blue-800 font-semibold";
                    } else {
                      if (isRightAnswer) btnStyle = "border-green-600 bg-green-100 text-green-900 font-bold";
                      else if (isSelected && !isCorrect) btnStyle = "border-red-500 bg-red-100 text-red-900 line-through";
                      else btnStyle = "border-slate-200 bg-white text-slate-400 opacity-60";
                    }

                    return (
                      <button
                        key={optIdx} disabled={showResult}
                        onClick={() => setAnswers({...answers, [item.id]: optIdx})}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                      >
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{String.fromCharCode(65 + optIdx)}</span>
                        <span className="flex-1 leading-normal">{option}</span>
                      </button>
                    );
                  })}
                </div>
                
                {showResult && (
                  <div className="mt-4 ml-10 pt-3 border-t border-dashed border-slate-200 text-xs font-semibold">
                    {isCorrect 
                      ? <span className="text-green-600">✓ Jawaban Benar (+ {itemScoreWeight} Poin)</span> 
                      : <span className="text-red-600">✗ Salah (Kunci Khas: {String.fromCharCode(65 + item.correct)})</span>
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
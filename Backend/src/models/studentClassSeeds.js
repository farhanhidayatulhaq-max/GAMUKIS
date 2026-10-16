// C:\Users\LOQ\.gemini\antigravity\scratch\gamukis_student_classes\Backend\models\studentClassSeeds.js
const STUDENT_CLASS_SEEDS = [
  // ==========================================
  // 1. KATEGORI SAINTEK
  // ==========================================
  {
    id: "saintek-matematika",
    slug: "matematika-saintek",
    title: "Matematika Saintek",
    category: "SAINTEK",
    categoryLabel: "Sains & Teknologi",
    level: "Menengah - Lanjutan",
    totalDuration: "24 Jam",
    totalModules: 18,
    rating: 4.8,
    enrolledCount: 1420,
    badge: "Populer",
    instructor: {
      name: "Dr. Hendra Wijaya, M.Sc.",
      title: "Spesialis Kalkulus & Aljabar Linier",
      avatar: "👨‍🏫"
    },
    description: "Kelas Matematika Saintek mendalami penalaran matematika analitis tingkat lanjut, mencakup kalkulus diferensial dan integral, trigonometri analitik, vektor, polinomial, serta matriks untuk persiapan ujian akademik dan pemecahan masalah kompleks.",
    learningObjectives: [
      "Menguasai teknik diferensiasi dan integrasi fungsi aljabar serta trigonometri.",
      "Menganalisis sifat geometri analitik ruang dan operasi vektor.",
      "Menyelesaikan sistem persamaan polinomial dan matriks berordo tinggi.",
      "Menerapkan konsep kalkulus pada pemodelan fenomena sains dan teknologi nyata."
    ],
    skillsAcquired: ["Analytical Thinking", "Quantitative Reasoning", "Calculus Mastery", "Complex Problem Solving"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Kalkulus Diferensial Lanjutan",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Turunan fungsi implisit, aturan rantai berganda, dan aplikasi nilai optimum.",
        lessons: [
          { id: "mat-1-1", title: "Aturan Rantai dan Turunan Parsial Dasar", duration: "45 Menit", type: "interactive" },
          { id: "mat-1-2", title: "Aplikasi Turunan: Gradien, Garis Singgung & Nilai Ekstrem", duration: "60 Menit", type: "video" },
          { id: "mat-1-3", title: "Latihan Soal Optimasi Real-World", duration: "40 Menit", type: "quiz" }
        ]
      },
      {
        chapterNumber: 2,
        title: "Integral Tak Tentu dan Tentu",
        duration: "5 Jam",
        difficulty: "Tinggi",
        summary: "Teknik substitusi, integral parsial, serta perhitungan luas dan volume benda putar.",
        lessons: [
          { id: "mat-2-1", title: "Teknik Substitusi dan Pecahan Parsial", duration: "50 Menit", type: "interactive" },
          { id: "mat-2-2", title: "Integral Parsial dan Metode Tabel", duration: "45 Menit", type: "video" },
          { id: "mat-2-3", title: "Aplikasi Volume Benda Putar Metode Cincin", duration: "60 Menit", type: "quiz" }
        ]
      },
      {
        chapterNumber: 3,
        title: "Matriks, Vektor & Geometri Ruang",
        duration: "5 Jam",
        difficulty: "Sedang",
        summary: "Operasi baris elementer, determinan matriks 3x3, proyeksi ortogonal, dan sudut antar-vektor.",
        lessons: [
          { id: "mat-3-1", title: "Determinan dan Invers Matriks Ordo 3", duration: "45 Menit", type: "interactive" },
          { id: "mat-3-2", title: "Perkalian Silang dan Titik Vektor 3 Dimensi", duration: "55 Menit", type: "video" },
          { id: "mat-3-3", title: "Persamaan Bidang dan Garis di R3", duration: "50 Menit", type: "reading" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-mat-1",
        title: "Katalog Formula Cepat: Turunan & Integral",
        content: "d/dx [sin(ax)] = a cos(ax) | ∫ e^(ax) dx = (1/a) e^(ax) + C | Luas di bawah kurva = ∫ [f(x) - g(x)] dx"
      },
      {
        id: "mod-mat-2",
        title: "Metode Cepat Determinan Sarrus",
        content: "Gunakan perkalian diagonal utama dikurangi perkalian diagonal sekunder untuk ordo 3x3."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-mat-1",
        question: "Berapakah turunan pertama dari f(x) = (3x^2 + 1)^4 pada x = 1?",
        options: ["96", "192", "384", "1536"],
        correct: "1536",
        explanation: "f'(x) = 4(3x^2 + 1)^3 * (6x). Untuk x = 1: 4*(4)^3 * 6 = 4 * 64 * 6 = 1536.",
        difficulty: "medium"
      },
      {
        id: "quiz-mat-2",
        question: "Hasil dari integral ∫ 4x^3 dx adalah...",
        options: ["x^4 + C", "12x^2 + C", "4x^4 + C", "x^3 + C"],
        correct: "x^4 + C",
        explanation: "∫ 4x^3 dx = 4 * (x^4 / 4) + C = x^4 + C.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "saintek-fisika",
    slug: "fisika-saintek",
    title: "Fisika",
    category: "SAINTEK",
    categoryLabel: "Sains & Teknologi",
    level: "Menengah",
    totalDuration: "20 Jam",
    totalModules: 16,
    rating: 4.7,
    enrolledCount: 1180,
    badge: "Eksperimental",
    instructor: {
      name: "Ir. Bambang Santoso, M.T.",
      title: "Praktisi Mekanika & Termodinamika",
      avatar: "🔬"
    },
    description: "Membedah prinsip dasar alam semesta melalui mekanika klasik Newton, dinamika fluida, gelombang elektromagnetik, optika, serta termodinamika secara terstruktur dan terukur.",
    learningObjectives: [
      "Menganalisis hukum gerak Newton dan hukum kekekalan energi mekanik.",
      "Menghitung debit, tekanan hidrostatis, dan hukum Bernoulli pada fluida mengalir.",
      "Menguasai hukum pertama dan kedua Termodinamika pada siklus Carnot."
    ],
    skillsAcquired: ["Scientific Modeling", "Fluid Dynamics", "Mechanics", "Experimental Data Analysis"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Mekanika & Dinamika Partikel",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Gerak melingkar beraturan, gesekan statis-kinetis, usaha, dan energi potensial gravitasi.",
        lessons: [
          { id: "fis-1-1", title: "Hukum II Newton pada Bidang Miring Kasar", duration: "45 Menit", type: "interactive" },
          { id: "fis-1-2", title: "Kekekalan Momentum dan Tumbukan", duration: "50 Menit", type: "video" }
        ]
      },
      {
        chapterNumber: 2,
        title: "Fluida Statis & Dinamis",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Tekanan gauge, gaya apung Archimedes, dan persamaan kontinuitas fluida ideal.",
        lessons: [
          { id: "fis-2-1", title: "Prinsip Pascal dan Gaya Archimedes", duration: "40 Menit", type: "interactive" },
          { id: "fis-2-2", title: "Teorema Torricelli dan Venturimeter", duration: "55 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-fis-1",
        title: "Hukum Termodinamika I",
        content: "ΔU = Q - W. Kalor yang masuk menambah energi dalam sistem setelah dikurangi kerja luar."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-fis-1",
        question: "Jika gaya neto yang bekerja pada benda bernilai nol, maka benda tersebut...",
        options: ["Pasti diam", "Pasti dipercepat", "Diam atau bergerak dengan kecepatan konstan", "Mengalami perlambatan"],
        correct: "Diam atau bergerak dengan kecepatan konstan",
        explanation: "Menurut Hukum I Newton (Inersia), jika resultan gaya = 0, benda diam tetap diam, benda bergerak lurus beraturan tetap dengan kecepatan konstan.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "saintek-kimia",
    slug: "kimia-saintek",
    title: "Kimia",
    category: "SAINTEK",
    categoryLabel: "Sains & Teknologi",
    level: "Menengah",
    totalDuration: "18 Jam",
    totalModules: 14,
    rating: 4.6,
    enrolledCount: 950,
    badge: "Laboratorium",
    instructor: {
      name: "Dr. Siti Rahmawati, S.Si.",
      title: "Peneliti Kimia Organik & Analitik",
      avatar: "🧪"
    },
    description: "Mempelajari struktur atom, ikatan kimia, stoikiometri, laju reaksi, kesetimbangan kimia, serta sifat koligatif larutan dengan visualisasi reaksi molekuler interaktif.",
    learningObjectives: [
      "Menyetarakan persamaan reaksi redoks dan menghitung mol stoikiometris.",
      "Memahami faktor penentu laju reaksi berdasarkan teori tumbukan.",
      "Menghitung pH larutan asam-basa kuat dan penyangga (buffer)."
    ],
    skillsAcquired: ["Stoichiometry", "Chemical Equilibrium", "Molecular Analysis"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Stoikiometri & Larutan",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Konsep mol, molaritas, pengenceran, dan pereaksi pembatas.",
        lessons: [
          { id: "kim-1-1", title: "Konsep Mol dan Volume Gas Molar (STP/RTP)", duration: "40 Menit", type: "interactive" },
          { id: "kim-1-2", title: "Penentuan Pereaksi Pembatas", duration: "45 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-kim-1",
        title: "Prinsip Le Chatelier",
        content: "Jika sistem kesetimbangan diberi gangguan (suhu, konsentrasi, tekanan), sistem akan bergeser meminimalkan gangguan tersebut."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-kim-1",
        question: "Berapakah massa molar (Mr) dari molekul air H2O jika Ar H=1 dan Ar O=16?",
        options: ["17 g/mol", "18 g/mol", "20 g/mol", "32 g/mol"],
        correct: "18 g/mol",
        explanation: "Mr H2O = 2*(1) + 16 = 18 g/mol.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "saintek-biologi",
    slug: "biologi-saintek",
    title: "Biologi",
    category: "SAINTEK",
    categoryLabel: "Sains & Teknologi",
    level: "Menengah",
    totalDuration: "22 Jam",
    totalModules: 16,
    rating: 4.8,
    enrolledCount: 1350,
    badge: "Hayati",
    instructor: {
      name: "Dra. Nurul Hidayah, M.Biomed.",
      title: "Dosen Biologi Sel & Genetika",
      avatar: "🌿"
    },
    description: "Eksplorasi kehidupan hayati dari tingkat molekuler, organel sel, metabolisme biokimia (fotosintesis & respirasi), pewarisan genetik Mendel, hingga keanekaragaman ekosistem bumi.",
    learningObjectives: [
      "Mengidentifikasi organel sel eukariotik beserta fungsi enzimatiknya.",
      "Menjelaskan alur siklus Krebs dan fosforilasi oksidatif dalam respirasi aerob.",
      "Menghitung rasio persilangan dihibrid dan memahami mutasi DNA."
    ],
    skillsAcquired: ["Genetics Mapping", "Cellular Biology", "Ecosystem Ecology"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Biologi Sel & Organel",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Perbedaan sel hewan dan tumbuhan, membran plasma, mitokondria, dan ribosom.",
        lessons: [
          { id: "bio-1-1", title: "Struktur Fosfolipid Bilayer Membran Sel", duration: "35 Menit", type: "interactive" },
          { id: "bio-1-2", title: "Transport Pasif (Osmosis) vs Transport Aktif", duration: "45 Menit", type: "video" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-bio-1",
        title: "Dogma Sentral Biologi Molekuler",
        content: "Replikasi DNA -> Transkripsi (mRNA) -> Translasi (Polipeptida/Protein)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-bio-1",
        question: "Organel sel yang berfungsi sebagai tempat utama produksi ATP seluler adalah...",
        options: ["Ribosom", "Mitokondria", "Lisosom", "Badan Golgi"],
        correct: "Mitokondria",
        explanation: "Mitokondria dikenal sebagai powerhouse of the cell karena menyelenggarakan rantai transpor elektron untuk menghasilkan molekul ATP.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "saintek-informatika",
    slug: "informatika-saintek",
    title: "Informatika",
    category: "SAINTEK",
    categoryLabel: "Sains & Teknologi",
    level: "Menengah - Lanjutan",
    totalDuration: "26 Jam",
    totalModules: 20,
    rating: 4.9,
    enrolledCount: 1680,
    badge: "Digital",
    instructor: {
      name: "Arya Pratama, M.Kom.",
      title: "Software Engineer & Competitive Programmer",
      avatar: "💻"
    },
    description: "Berpikir komputasional, algoritma pencarian dan pengurutan, struktur data (array, tree, graph), logika boolean, serta dasar arsitektur komputasi modern.",
    learningObjectives: [
      "Mendesain algoritma dengan kompleksitas waktu Big-O yang efisien.",
      "Menerapkan struktur data antrean (queue), tumpukan (stack), dan pohon biner.",
      "Menyelesaikan studi kasus logika komputasi secara modular."
    ],
    skillsAcquired: ["Computational Thinking", "Algorithm Optimization", "Data Structures"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Berpikir Komputasional & Kompleksitas",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Dekomposisi, pengenalan pola, abstraksi, dan analisis efisiensi Big-O.",
        lessons: [
          { id: "inf-1-1", title: "Analisis Kompleksitas Waktu O(1), O(n), O(n log n)", duration: "45 Menit", type: "interactive" },
          { id: "inf-1-2", title: "Algoritma Binary Search vs Linear Search", duration: "50 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-inf-1",
        title: "Prinsip FIFO vs LIFO",
        content: "Queue menggunakan FIFO (First In First Out), sedangkan Stack menggunakan LIFO (Last In First Out)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-inf-1",
        question: "Kompleksitas waktu terbaik untuk mencari elemen pada array berurutan dengan Binary Search adalah...",
        options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
        correct: "O(log n)",
        explanation: "Binary Search membagi ruang pencarian menjadi setengah pada setiap langkah sehingga kompleksitasnya adalah O(log n).",
        difficulty: "medium"
      }
    ]
  },

  // ==========================================
  // 2. KATEGORI SOSHUM
  // ==========================================
  {
    id: "soshum-sejarah",
    slug: "sejarah-soshum",
    title: "Sejarah",
    category: "SOSHUM",
    categoryLabel: "Sosial & Humaniora",
    level: "Menengah",
    totalDuration: "16 Jam",
    totalModules: 12,
    rating: 4.7,
    enrolledCount: 890,
    badge: "Kronologis",
    instructor: {
      name: "Drs. Kuncoro Hadi, M.Hum.",
      title: "Sejarawan & Kurator Arsip Nasional",
      avatar: "🏛️"
    },
    description: "Menelusuri lintasan peristiwa peradaban nusantara dan dunia, mulai dari kerajaan maritim Hindu-Buddha, era kolonialisme, diplomasi kemerdekaan, hingga dinamika perang dingin secara kritis.",
    learningObjectives: [
      "Menganalisis metodologi penelitian sejarah: heuristik, verifikasi, interpretasi, dan historiografi.",
      "Memahami kausalitas pergerakan nasional dan peran organisasi Budi Utomo serta Sumpah Pemuda.",
      "Menghubungkan peristiwa Perang Dingin dengan peta geopolitik global modern."
    ],
    skillsAcquired: ["Historical Analysis", "Source Criticism", "Geopolitical Awareness"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Metodologi Sejarah & Praaksara",
        duration: "3 Jam",
        difficulty: "Dasar",
        summary: "Empat tahapan penelitian sejarah dan corak kehidupan masa berburu hingga bercocok tanam.",
        lessons: [
          { id: "sej-1-1", title: "Kritik Sumber: Eksternal vs Internal", duration: "40 Menit", type: "interactive" },
          { id: "sej-1-2", title: "Kebudayaan Paleolitikum hingga Megalitikum", duration: "45 Menit", type: "video" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-sej-1",
        title: "Tahapan Penelitian Sejarah",
        content: "1. Heuristik (pengumpulan sumber) -> 2. Verifikasi/Kritik -> 3. Interpretasi -> 4. Historiografi (penulisan)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-sej-1",
        question: "Tahap dalam penelitian sejarah yang bertujuan untuk menguji keaslian dan keabsahan sumber disebut...",
        options: ["Heuristik", "Verifikasi/Kritik", "Historiografi", "Periodisasi"],
        correct: "Verifikasi/Kritik",
        explanation: "Verifikasi atau kritik sumber (baik intern maupun ekstern) dilakukan untuk membuktikan autentisitas dan kredibilitas data sejarah.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "soshum-geografi",
    slug: "geografi-soshum",
    title: "Geografi",
    category: "SOSHUM",
    categoryLabel: "Sosial & Humaniora",
    level: "Menengah",
    totalDuration: "18 Jam",
    totalModules: 14,
    rating: 4.6,
    enrolledCount: 780,
    badge: "Geospasial",
    instructor: {
      name: "Rina Kusuma, S.Si., M.Sc.",
      title: "Ahli Geospasial & Sistem Informasi Geografis",
      avatar: "🌍"
    },
    description: "Kajian ruang muka bumi meliputi litosfer, atmosfer, hidrosfer, pedosfer, serta interaksi spasial kependudukan dan pemanfaatan peta/Sistem Informasi Geografis (SIG).",
    learningObjectives: [
      "Menguasai 10 konsep esensial geografi dan 4 prinsip analisis geosfer.",
      "Menginterpretasikan citra penginderaan jauh dan layer data SIG.",
      "Menganalisis dampak perubahan iklim global terhadap pola cuaca khatulistiwa."
    ],
    skillsAcquired: ["Spatial Analysis", "GIS Literacy", "Environmental Sustainability"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Konsep Dasar Geografi & Pemetaan",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Skala peta, proyeksi peta, simbol, dan pembacaan kontur topografi.",
        lessons: [
          { id: "geo-1-1", title: "10 Konsep Esensial Geografi di Lingkungan Nyata", duration: "45 Menit", type: "interactive" },
          { id: "geo-1-2", title: "Menghitung Interval Kontur dan Skala Peta", duration: "40 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-geo-1",
        title: "Prinsip Utama Geografi",
        content: "Distribusi (persebaran), Interelasi (keterkaitan), Deskripsi (penjelasan), dan Korologi (gabungan komprehensif)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-geo-1",
        question: "Prinsip geografi yang memadukan persebaran, keterkaitan, dan penggambarannya dalam satu ruang disebut...",
        options: ["Prinsip Distribusi", "Prinsip Interelasi", "Prinsip Korologi", "Prinsip Deskripsi"],
        correct: "Prinsip Korologi",
        explanation: "Prinsip korologi merupakan prinsip geografi yang komprehensif memadukan persebaran, interelasi, dan deskripsi gejala di ruang muka bumi.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "soshum-ekonomi",
    slug: "ekonomi-soshum",
    title: "Ekonomi",
    category: "SOSHUM",
    categoryLabel: "Sosial & Humaniora",
    level: "Menengah",
    totalDuration: "20 Jam",
    totalModules: 15,
    rating: 4.8,
    enrolledCount: 1120,
    badge: "Finansial",
    instructor: {
      name: "Farhan Mahendra, S.E., M.Ec.",
      title: "Analis Kebijakan Fiskal & Moneter",
      avatar: "📈"
    },
    description: "Memahami mekanisme pasar permintaan-penawaran, elastisitas, struktur pasar, pendapatan nasional (PDB), inflasi, kebijakan bank sentral, serta perdagangan internasional.",
    learningObjectives: [
      "Menghitung elastisitas harga permintaan dan penawaran.",
      "Menganalisis instrumen moneter (suku bunga BI, cadangan kas wajib, operasi pasar terbuka).",
      "Menyusun persamaan dasar akuntansi dan laporan keuangan sederhana."
    ],
    skillsAcquired: ["Market Analysis", "Macroeconomics", "Financial Decision Making"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Mekanisme Pasar & Elastisitas",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Keseimbangan pasar (ekuilibrium), pergeseran kurva, dan jenis elastisitas.",
        lessons: [
          { id: "eko-1-1", title: "Faktor Penentu Permintaan dan Penawaran", duration: "40 Menit", type: "interactive" },
          { id: "eko-1-2", title: "Menghitung Titik Ekuilibrium Pasar (Qd = Qs)", duration: "45 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-eko-1",
        title: "Rumus Pendapatan Nasional (Metode Pengeluaran)",
        content: "Y = C + I + G + (X - M). C=Konsumsi, I=Investasi, G=Belanja Pemerintah, X=Ekspor, M=Impor."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-eko-1",
        question: "Jika harga barang naik dan total penerimaan penjual justru meningkat, maka barang tersebut bersifat...",
        options: ["Elastis", "Inelastis", "Elastis uniter", "Inelastis sempurna"],
        correct: "Inelastis",
        explanation: "Pada barang inelastis (|Ed| < 1), persentase penurunan jumlah barang lebih kecil dari persentase kenaikan harga, sehingga TR meningkat.",
        difficulty: "medium"
      }
    ]
  },
  {
    id: "soshum-sosiologi",
    slug: "sosiologi-soshum",
    title: "Sosiologi",
    category: "SOSHUM",
    categoryLabel: "Sosial & Humaniora",
    level: "Menengah",
    totalDuration: "16 Jam",
    totalModules: 12,
    rating: 4.7,
    enrolledCount: 860,
    badge: "Masyarakat",
    instructor: {
      name: "Dewi Lestari, S.Sos., M.Si.",
      title: "Pemerhati Dinamika Sosial & Komunitas",
      avatar: "👥"
    },
    description: "Mengkaji interaksi sosial, pembentukan kelompok sosial, konflik dan integrasi, stratifikasi sosial, perubahan sosial budaya di era digital, serta metode penelitian sosial kualitatif.",
    learningObjectives: [
      "Menganalisis bentuk-bentuk akomodasi dalam meredam konflik sosial.",
      "Membedakan kriteria diferensiasi sosial dan stratifikasi sosial terbuka/tertutup.",
      "Menjelaskan teori perubahan sosial: evolusi, siklus, dan fungsionalisme struktural."
    ],
    skillsAcquired: ["Sociological Empathy", "Social Research", "Conflict Resolution"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Interaksi Sosial & Nilai Norma",
        duration: "3 Jam",
        difficulty: "Dasar",
        summary: "Kontak sosial, komunikasi, proses asosiatif vs disosiatif, serta penegakan norma.",
        lessons: [
          { id: "sos-1-1", title: "Syarat Terjadinya Interaksi Sosial", duration: "35 Menit", type: "interactive" },
          { id: "sos-1-2", title: "Akomodasi Konflik: Mediasi, Arbitrase, Kompromi", duration: "45 Menit", type: "video" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-sos-1",
        title: "Bentuk-Bentuk Akomodasi Konflik",
        content: "Mediasi (pihak ketiga netral penasihat) vs Arbitrase (pihak ketiga mengambil keputusan yang mengikat)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-sos-1",
        question: "Upaya penyelesaian konflik melalui pihak ketiga yang berhak mengambil keputusan mengikat disebut...",
        options: ["Mediasi", "Arbitrase", "Konsiliasi", "Kompromi"],
        correct: "Arbitrase",
        explanation: "Arbitrase melibatkan pihak ketiga berwenang yang memberi keputusan mengikat kedua belah pihak.",
        difficulty: "easy"
      }
    ]
  },

  // ==========================================
  // 3. KATEGORI BAHASA (8 MATA PELAJARAN LENGKAP)
  // ==========================================
  {
    id: "bahasa-indonesia",
    slug: "bahasa-indonesia",
    title: "Bahasa Indonesia",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Mahir",
    totalDuration: "20 Jam",
    totalModules: 16,
    rating: 4.9,
    enrolledCount: 2150,
    badge: "Wajib Nasional",
    instructor: {
      name: "Dr. Sri Mulyati, M.Pd.",
      title: "Ahli Linguistik & Sastra Indonesia",
      avatar: "🇮🇩"
    },
    description: "Pendalaman tata bahasa baku (PUEBI/EYD V), morfologi, sintaksis kalimat efektif, analisis teks eksposisi, argumentasi, anekdot, resensi, dan apresiasi karya sastra prosa serta puisi.",
    learningObjectives: [
      "Menerapkan kaidah ejaan bahasa Indonesia yang disempurnakan (EYD Edisi V) secara presisi.",
      "Menyusun kalimat efektif dengan struktur subjek, predikat, objek, dan keterangan yang padu.",
      "Menganalisis ide pokok, simpulan tersirat, dan fakta-opini dalam teks editorial.",
      "Mengapresiasi gaya bahasa (majas ironi, metafora, hiperbola) dalam karya sastra."
    ],
    skillsAcquired: ["PUEBI/EYD V", "Kalimat Efektif", "Literasi Kritis", "Menulis Kreatif & Ilmiah"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "PUEBI & Tata Kalimat Efektif",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Penulisan huruf kapital, kata serapan, tanda baca titik koma/titik dua, dan kehematan kata.",
        lessons: [
          { id: "bind-1-1", title: "Kaidah EYD V: Penulisan Huruf dan Kata Gabung", duration: "40 Menit", type: "interactive" },
          { id: "bind-1-2", title: "Ciri Kalimat Efektif: Keparalelan & Ketegasan", duration: "45 Menit", type: "video" },
          { id: "bind-1-3", title: "Uji Mandiri Kalimat Rancang Bangun", duration: "35 Menit", type: "quiz" }
        ]
      },
      {
        chapterNumber: 2,
        title: "Analisis Berbagai Ragam Teks",
        duration: "5 Jam",
        difficulty: "Sedang",
        summary: "Struktur teks LHO, teks eksposisi, teks negosiasi, dan teks anekdot.",
        lessons: [
          { id: "bind-2-1", title: "Teks Laporan Hasil Observasi: Definisi vs Deskripsi", duration: "45 Menit", type: "interactive" },
          { id: "bind-2-2", title: "Retorika Anekdot & Majas Sindiran", duration: "50 Menit", type: "video" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-bind-1",
        title: "Prinsip Keparalelan Kalimat Efektif",
        content: "Bentuk kata harus seragam. Contoh: 'Tahapan penelitian meliputi pengumpulan data, analisis data, dan pelaporan hasil' (semua nomina berimbuhan pe-an)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-bind-1",
        question: "Manakah kalimat berikut yang merupakan contoh kalimat efektif?",
        options: [
          "Bagi para siswa-siswa diharapkan segera berkumpul.",
          "Para siswa diharapkan segera berkumpul di aula sekolah.",
          "Untuk mempersingkat waktu, acara kita lanjutkan.",
          "Rapat itu membahas daripada masalah kebersihan."
        ],
        correct: "Para siswa diharapkan segera berkumpul di aula sekolah.",
        explanation: "Pilihan ini hemat kata (tidak menggunakan kata 'para siswa-siswa' yang pleonasme) dan memiliki subjek serta predikat yang logis.",
        difficulty: "easy"
      },
      {
        id: "quiz-bind-2",
        question: "Teks yang berisi kelucuan sekaligus mengandung sindiran atau kritik moral disebut teks...",
        options: ["Eksposisi", "Anekdot", "Deskripsi", "Prosedur"],
        correct: "Anekdot",
        explanation: "Teks anekdot menceritakan kejadian menggelikan yang berisikan pesan kritik atau sindiran halus bagi khalayak.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "bahasa-inggris",
    slug: "bahasa-inggris",
    title: "Bahasa Inggris",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Lanjutan",
    totalDuration: "24 Jam",
    totalModules: 18,
    rating: 4.9,
    enrolledCount: 2400,
    badge: "Global Communication",
    instructor: {
      name: "Arthur Pendelton, M.A. TESOL",
      title: "Senior English Language Specialist",
      avatar: "🇬🇧"
    },
    description: "Mengembangkan kemahiran tata bahasa (tenses, conditionals, passive voice, reported speech), vocabulary akademis (CEFR B1-C1), reading comprehension kritis, serta teknik listening dialog internasional.",
    learningObjectives: [
      "Menguasai penggunaan 12 tenses dan klausa kondisional (Type 0, 1, 2, 3) secara fasih.",
      "Memahami gagasan utama, inferensi konteks, dan nada penulis dalam esai bahasa Inggris.",
      "Menyusun paragraf argumentatif menggunakan transitional phrases yang kohesif."
    ],
    skillsAcquired: ["Academic English", "Grammar & Syntax", "Critical Reading", "CEFR Proficiency"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Mastering Tenses & Sentence Structures",
        duration: "5 Jam",
        difficulty: "Sedang",
        summary: "Present perfect continuous, past perfect vs simple past, future forms, and inversion.",
        lessons: [
          { id: "eng-1-1", title: "Perfect vs Continuous Aspects Demystified", duration: "45 Menit", type: "interactive" },
          { id: "eng-1-2", title: "Subject-Verb Agreement in Complex Clauses", duration: "50 Menit", type: "video" },
          { id: "eng-1-3", title: "Practice: Spotting Grammar Pitfalls", duration: "35 Menit", type: "quiz" }
        ]
      },
      {
        chapterNumber: 2,
        title: "Conditionals & Subjunctive Mood",
        duration: "4 Jam",
        difficulty: "Lanjutan",
        summary: "If-clauses, mixed conditionals, wish/if only, and hypothetical clauses.",
        lessons: [
          { id: "eng-2-1", title: "Mixed Conditionals in Real Contexts", duration: "45 Menit", type: "interactive" },
          { id: "eng-2-2", title: "Inverted Conditionals (Had I known...)", duration: "40 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-eng-1",
        title: "Conditionals Cheat Sheet",
        content: "Type 1: If + present, will + v1. Type 2: If + past simple, would + v1. Type 3: If + past perfect, would have + v3."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-eng-1",
        question: "If she _____ harder yesterday, she would have passed the final exam.",
        options: ["studied", "had studied", "studies", "would study"],
        correct: "had studied",
        explanation: "Third conditional describes an unreal past situation: If + past perfect (had studied), would have + verb 3.",
        difficulty: "medium"
      }
    ]
  },
  {
    id: "bahasa-jawa",
    slug: "bahasa-jawa",
    title: "Bahasa Jawa",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah",
    totalDuration: "16 Jam",
    totalModules: 12,
    rating: 4.8,
    enrolledCount: 920,
    badge: "Budaya Lokal",
    instructor: {
      name: "Ki Danang Setyadi, S.Pd., M.Hum.",
      title: "Budayawan & Pengajar Sastra Jawa",
      avatar: "🎭"
    },
    description: "Sinau Unggah-Ungguh Basa Jawa (Ngoko Lugu, Ngoko Alus, Krama Lugu, Krama Alus/Inggil), maca lan nulis Aksara Jawa (sandhangan, pasangan, rekan, murda), tembang macapat (Pocung, Sinom, Dhandhanggula), sarta paribasan Jawa.",
    learningObjectives: [
      "Mbedakake tataran basa Jawa: Ngoko, Krama Madya, lan Krama Inggil miturut tata krama.",
      "Maca lan nulis teks ukara migunakake Aksara Jawa jangkep sandhangan lan pasangan.",
      "Mangerteni paugeran tembang macapat: guru gatra, guru wilangan, lan guru lagu."
    ],
    skillsAcquired: ["Unggah-Ungguh Basa", "Aksara Jawa", "Tembang Macapat", "Paribasan & Budaya"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Unggah-Ungguh Basa: Ngoko nganti Krama Inggil",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Panganggone tembung krama marang wong tuwa, guru, lan kanca sapadha-padha.",
        lessons: [
          { id: "jaw-1-1", title: "Paugeran Ngoko Alus vs Krama Alus", duration: "45 Menit", type: "interactive" },
          { id: "jaw-1-2", title: "Gladhen Pacelathon Padinan Basa Jawa", duration: "40 Menit", type: "video" },
          { id: "jaw-1-3", title: "Kuis Nyalin Ukara Ngoko dadi Krama Alus", duration: "35 Menit", type: "quiz" }
        ]
      },
      {
        chapterNumber: 2,
        title: "Aksara Jawa & Sandhangan",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Aksara nglegena 20, sandhangan swara (wulu, suku, taling, tarung), panyigeg, lan pasangan.",
        lessons: [
          { id: "jaw-2-1", title: "Aksara Nglegena lan Pasangane", duration: "50 Menit", type: "interactive" },
          { id: "jaw-2-2", title: "Paugeran Sandhangan Swara lan Panyigeg Wanda", duration: "45 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-jaw-1",
        title: "Paugeran Tembang Pocung",
        content: "Guru gatra: 4 | Guru wilangan & lagu: 12u, 6a, 8i, 12a."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-jaw-1",
        question: "Ukara 'Bapak nembe mangan sega goreng', yen diowahi dadi krama alus kang trep yaiku...",
        options: [
          "Bapak nembe nedha sekul goreng.",
          "Bapak saweg dhahar sekul goreng.",
          "Bapak nembe dhahar sega goreng.",
          "Bapak saweg nedha sega goreng."
        ],
        correct: "Bapak saweg dhahar sekul goreng.",
        explanation: "Kanggo wong tuwa (Bapak) nggunakake tembung krama alus: 'mangan' dadi 'dhahar', 'sega' dadi 'sekul', lan 'nembe' dadi 'saweg'.",
        difficulty: "medium"
      }
    ]
  },
  {
    id: "bahasa-prancis",
    slug: "bahasa-prancis",
    title: "Bahasa Prancis",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah (A1-A2)",
    totalDuration: "18 Jam",
    totalModules: 14,
    rating: 4.8,
    enrolledCount: 760,
    badge: "Eropa Kontinental",
    instructor: {
      name: "Claire Dubois, M.A. FLE",
      title: "Enseignante de Français Langue Étrangère",
      avatar: "🇫🇷"
    },
    description: "Apprendre le français dès le début: salutations, articles définis/indéfinis, conjugaison des verbes du 1er, 2e et 3e groupe (Présent, Passé Composé, Futur Proche), vocabulaire du quotidien et culture française.",
    learningObjectives: [
      "Menguasai pelafalan alfabet Prancis, nasal sounds, dan liaison dasar.",
      "Melakukan konjugasi kata kerja penting: être, avoir, aller, faire dalam waktu kini (présent).",
      "Memperkenalkan diri, memesan di restoran, dan menanyakan arah dalam bahasa Prancis."
    ],
    skillsAcquired: ["French Phonetics", "Conjugaison des Verbes", "Salutations & Quotidien"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Les Bases: Salutations et Verbes Essentiels",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Bonjour, au revoir, comment ça va, konjugasi verbe être et avoir.",
        lessons: [
          { id: "fra-1-1", title: "L'alphabet français et les sons nasaux", duration: "40 Menit", type: "interactive" },
          { id: "fra-1-2", title: "Être et Avoir au présent de l'indicatif", duration: "45 Menit", type: "video" },
          { id: "fra-1-3", title: "Quiz: Présentation de soi", duration: "30 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-fra-1",
        title: "Konjugasi Dasar Verbe Être (Présent)",
        content: "Je suis | Tu es | Il/Elle est | Nous sommes | Vous êtes | Ils/Elles sont."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-fra-1",
        question: "Bagaimanakah konjugasi yang tepat untuk subjek 'Nous' pada kata kerja 'être' waktu kini?",
        options: ["Nous sommes", "Nous êtes", "Nous avons", "Nous ont"],
        correct: "Nous sommes",
        explanation: "Konjugasi kata kerja être untuk subjek nous (kami/kita) adalah 'nous sommes'.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "bahasa-jerman",
    slug: "bahasa-jerman",
    title: "Bahasa Jerman",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah (A1-A2)",
    totalDuration: "18 Jam",
    totalModules: 14,
    rating: 4.7,
    enrolledCount: 690,
    badge: "Eropa Tengah",
    instructor: {
      name: "Wolfgang Becker, M.Ed. DaF",
      title: "Dosen Deutsch als Fremdsprache",
      avatar: "🇩🇪"
    },
    description: "Belajar tata bahasa Jerman terstruktur: der/die/das (kasus Nominativ, Akkusativ, Dativ), trennbare Verben, susunan kalimat Hauptsatz dan Nebensatz, angka, jam, dan komunikasi praktis sehari-hari di Jerman.",
    learningObjectives: [
      "Membedakan artikel benda Jerman (Maskulin 'der', Feminin 'die', Netral 'das').",
      "Memahami perubahan artikel pada kasus Nominativ, Akkusativ, dan Dativ.",
      "Menyusun kalimat sederhana dengan posisi kata kerja di posisi kedua (Verb-Zweit-Stellung)."
    ],
    skillsAcquired: ["Deutsche Grammatik", "Akkusativ & Dativ", "Satzstruktur"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Artikel dan Kasus Nominativ - Akkusativ",
        duration: "4 Jam",
        difficulty: "Sedang",
        summary: "Perubahan der -> den pada kasus Akkusativ untuk objek langsung maskulin.",
        lessons: [
          { id: "ger-1-1", title: "Bestimmter und unbestimmter Artikel", duration: "45 Menit", type: "interactive" },
          { id: "ger-1-2", title: "Akkusativ: Mengidentifikasi Objek Langsung", duration: "40 Menit", type: "video" },
          { id: "ger-1-3", title: "Kuis Kasus Akkusativ", duration: "35 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-ger-1",
        title: "Tabel Artikel Kasus Akkusativ",
        content: "Maskulin: den/einen | Feminin: die/eine | Netral: das/ein | Plural: die/-"
      }
    ],
    miniQuiz: [
      {
        id: "quiz-ger-1",
        question: "Lengkapi kalimat: 'Ich habe _____ Apfel (maskulin: der Apfel)'.",
        options: ["einen", "ein", "eine", "einem"],
        correct: "einen",
        explanation: "Karena Apfel adalah maskulin (der Apfel) dan berposisi sebagai objek langsung dari kata kerja haben, artikel tak tentu berubah menjadi 'einen' (Akkusativ).",
        difficulty: "medium"
      }
    ]
  },
  {
    id: "bahasa-mandarin",
    slug: "bahasa-mandarin",
    title: "Bahasa Mandarin",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah (HSK 1-3)",
    totalDuration: "22 Jam",
    totalModules: 16,
    rating: 4.9,
    enrolledCount: 1540,
    badge: "Asia Timur & Karir",
    instructor: {
      name: "Chen Wei, B.A., M.TCSOL",
      title: "Spesialis Pengajaran Mandarin HSK",
      avatar: "🇨🇳"
    },
    description: "Pembelajaran bahasa Mandarin komprehensif: Sistem Pinyin, 4 nada (shēngdiào), goresan dasar aksara Hanzi (bihua), tata bahasa kalimat SVO, bilangan, kata bantu ukuran (量词 liàngcí), dan dialog praktis.",
    learningObjectives: [
      "Menguasai sistem Pinyin beserta 4 nada intonasi dan nada netral secara akurat.",
      "Menulis dan mengenali minimal 150 karakter Hanzi dasar HSK Level 1.",
      "Menggunakan kata bantu bilangan (measure words) seperti 个 (gè), 本 (běn), 张 (zhāng) dengan tepat."
    ],
    skillsAcquired: ["Pinyin & Tones Mastery", "Hanzi Characters", "HSK Preparation"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Pinyin, 4 Nada & Goresan Hanzi Dasar",
        duration: "5 Jam",
        difficulty: "Sedang",
        summary: "Inisial (shengmu), final (yunmu), aturan perubahan nada ke-3, dan 8 goresan utama Hanzi.",
        lessons: [
          { id: "man-1-1", title: "Pelafalan 4 Nada Pinyin dan Latihan Mendengar", duration: "45 Menit", type: "interactive" },
          { id: "man-1-2", title: "Urutan Goresan Hanzi (笔顺 bǐshùn): Kiri ke Kanan, Atas ke Bawah", duration: "50 Menit", type: "video" },
          { id: "man-1-3", title: "Latihan Soal Nada dan Hanzi Dasar", duration: "35 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-man-1",
        title: "4 Nada Pinyin Mandarin",
        content: "Nada 1: Datar tinggi (ā) | Nada 2: Naik (á) | Nada 3: Turun lalu naik (ǎ) | Nada 4: Hentak turun (à)."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-man-1",
        question: "Kata sapaan umum 'Halo' atau 'Apa kabar' dalam bahasa Mandarin Pinyin ditulis sebagai...",
        options: ["Nǐ hǎo", "Xièxie", "Zàijiàn", "Duìbuqǐ"],
        correct: "Nǐ hǎo",
        explanation: "你好 (Nǐ hǎo) adalah sapaan paling mendasar dalam bahasa Mandarin yang berarti Halo / Apa kabar.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "bahasa-spanyol",
    slug: "bahasa-spanyol",
    title: "Bahasa Spanyol",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah (DELE A1-A2)",
    totalDuration: "18 Jam",
    totalModules: 14,
    rating: 4.8,
    enrolledCount: 820,
    badge: "Hispanik Dunia",
    instructor: {
      name: "Sofia Rodriguez, Lic. Filología",
      title: "Instruktur Bahasa Spanyol & Budaya Hispanik",
      avatar: "🇪🇸"
    },
    description: "Belajar bahasa Spanyol (Español): fonetik vokal bersih, kata benda bergender (-o/-a), konjugasi verba reguler -ar/-er/-ir, perbedaan ser vs estar, percakapan sehari-hari dan kebudayaan Amerika Latin serta Spanyol.",
    learningObjectives: [
      "Menguasai perbedaan pemakaian kata kerja 'Ser' (sifat permanen) dan 'Estar' (kondisi sementara/lokasi).",
      "Melakukan konjugasi kata kerja berakhiran -ar, -er, dan -ir pada waktu kini (Presente de Indicativo).",
      "Berkomunikasi aktif dalam skenario perkenalan, belanja, dan perjalanan."
    ],
    skillsAcquired: ["Spanish Verb Conjugation", "Ser vs Estar", "Conversación Básica"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Fundamentos: Ser vs Estar & Verbos Regulares",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Perkenalan diri, alfabet spanyol, aturan gender kata benda, dan pemakaian ser vs estar.",
        lessons: [
          { id: "spa-1-1", title: "Pronunciación y el Alfabeto Español", duration: "35 Menit", type: "interactive" },
          { id: "spa-1-2", title: "Diferencia Crucial: Ser vs Estar con Ejemplos", duration: "50 Menit", type: "video" },
          { id: "spa-1-3", title: "Quiz de Conjugación Presente", duration: "35 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-spa-1",
        title: "Perbedaan Cepat Ser vs Estar",
        content: "Ser = Karakteristik abadi, asal usul, profesi, jam. Estar = Emosi sesaat, kondisi fisik kesehatan, lokasi tempat."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-spa-1",
        question: "Untuk menyatakan lokasi 'Saya sedang di perpustakaan' dalam bahasa Spanyol digunakan...",
        options: ["Estoy en la biblioteca", "Soy en la biblioteca", "Tengo en la biblioteca", "Voy en la biblioteca"],
        correct: "Estoy en la biblioteca",
        explanation: "Kata kerja 'Estar' digunakan untuk menyatakan lokasi keberadaan atau letak tempat.",
        difficulty: "easy"
      }
    ]
  },
  {
    id: "bahasa-melayu",
    slug: "bahasa-melayu",
    title: "Bahasa Melayu",
    category: "BAHASA",
    categoryLabel: "Bahasa & Literasi",
    level: "Dasar - Menengah",
    totalDuration: "16 Jam",
    totalModules: 12,
    rating: 4.8,
    enrolledCount: 710,
    badge: "Serumpun Nusantara",
    instructor: {
      name: "Zulkifli bin Ismail, M.A.",
      title: "Penyelidik Bahasa & Kesusasteraan Melayu Serumpun",
      avatar: "🇲🇾"
    },
    description: "Mempelajari tatabahasa Dewan Bahasa Melayu serumpun, perbandingan kosa kata Bahasa Melayu baku dan Bahasa Indonesia, imbuhan meN-, peN-, ber-, pantun empat kerat, peribahasa serumpun, serta laras bahasa rasmi.",
    learningObjectives: [
      "Memahami perbedaan semantik kosa kata seiras antara Bahasa Melayu dan Bahasa Indonesia.",
      "Menguasai hukum tatabahasa frasa sendi nama dan sistem imbuhan Bahasa Melayu.",
      "Menganalisis makna kiasan dalam pantun nasihat dan peribahasa Melayu klasik."
    ],
    skillsAcquired: ["Tatabahasa Melayu", "Kosa Kata Serumpun", "Pantun & Peribahasa", "Laras Bahasa Rasmi"],
    syllabus: [
      {
        chapterNumber: 1,
        title: "Tatabahasa & Perbandingan Kosa Kata Serumpun",
        duration: "4 Jam",
        difficulty: "Dasar",
        summary: "Perbandingan istilah (e.g. kereta/mobil, pejabat/kantor, hospital/rumah sakit) dan tata kalimat aktif-pasif.",
        lessons: [
          { id: "mel-1-1", title: "Kosa Kata Seiras tapi Berbeda Makna (False Friends)", duration: "40 Menit", type: "interactive" },
          { id: "mel-1-2", title: "Sistem Imbuhan meN- dan peN- Tatabahasa Dewan", duration: "45 Menit", type: "video" },
          { id: "mel-1-3", title: "Latihan Pantun & Kuis Kosa Kata Melayu", duration: "35 Menit", type: "quiz" }
        ]
      }
    ],
    interactiveModules: [
      {
        id: "mod-mel-1",
        title: "Peribahasa Terkenal Melayu Serumpun",
        content: "Bagai aur dengan tebing = saling tolong-menolong | Harimau mati meninggalkan belang, manusia mati meninggalkan nama = jasa baik akan selalu dikenang."
      }
    ],
    miniQuiz: [
      {
        id: "quiz-mel-1",
        question: "Dalam bahasa Melayu, perkataan yang bermaksud 'kantor' dalam bahasa Indonesia adalah...",
        options: ["Pejabat", "Kedai", "Bengkel", "Wisma"],
        correct: "Pejabat",
        explanation: "Dalam bahasa Melayu baku, 'pejabat' merujuk kepada premis atau bangunan tempat bekerja (kantor), manakala orangnya disebut 'pegawai'.",
        difficulty: "medium"
      }
    ]
  }
];

const DAILY_RECOMMENDATIONS_SEEDS = [
  {
    id: "rec-1",
    classSlug: "bahasa-indonesia",
    subject: "Bahasa Indonesia",
    category: "BAHASA",
    tag: "Fokus Hari Ini",
    title: "Bedah Kaidah EYD Edisi V & Kalimat Efektif",
    duration: "25 Menit",
    reason: "Materi paling sering keluar di tes literasi dan penalaran skolastik."
  },
  {
    id: "rec-2",
    classSlug: "bahasa-inggris",
    subject: "Bahasa Inggris",
    category: "BAHASA",
    tag: "Tantangan Harian",
    title: "Mastering Conditionals: Mixed & Inverted Clauses",
    duration: "30 Menit",
    reason: "Tingkatkan akurasi grammar dan pemahaman teks bahasa Inggris internasional."
  },
  {
    id: "rec-3",
    classSlug: "matematika-saintek",
    subject: "Matematika Saintek",
    category: "SAINTEK",
    tag: "Latihan Kilat",
    title: "Trik Cepat Turunan dan Nilai Maksimum-Minimum",
    duration: "20 Menit",
    reason: "Asah ketajaman logika analitis dengan variasi soal kalkulus modern."
  },
  {
    id: "rec-4",
    classSlug: "bahasa-mandarin",
    subject: "Bahasa Mandarin",
    category: "BAHASA",
    tag: "Bahasa Baru",
    title: "Latihan 4 Nada Pinyin & Pengenalan 8 Goresan Hanzi",
    duration: "20 Menit",
    reason: "Kuasai bahasa internasional terpopuler dengan pondasi nada yang kokoh."
  }
];

module.exports = {
  STUDENT_CLASS_SEEDS,
  DAILY_RECOMMENDATIONS_SEEDS
};


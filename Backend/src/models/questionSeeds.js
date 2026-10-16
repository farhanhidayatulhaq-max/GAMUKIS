const SEED_QUESTIONS = [
  // --- INDONESIA (25 Soal) ---
  {
    subject: "indonesia",
    question: "Berikut kata-kata sering ada dalam kalimat definisi, kecuali...",
    options: ["Adalah", "Merupakan", "Yang", "Yaitu"],
    correct: "Yang"
  },
  {
    subject: "indonesia",
    question: "Yang bukan merupakan contoh kalimat deskripsi adalah...",
    options: [
      "Tubuh mereka berwarna putih dengan aksen merah muda lembut atau cerah",
      "Sayap depan berfungsi melindungi sayap belakang sehingga teksturnya lebih keras",
      "Saat bertelur tonggeret betina menempelkan telur-telurnya di cabang atau batang pohon dan rerumputan?",
      "Tonggeret adalah jenis dari serangga"
    ],
    correct: "Tonggeret adalah jenis dari serangga"
  },
  {
    subject: "indonesia",
    question: "Mana penulisan daftar pustaka paling tepat berdasarkan identitas buku berikut ini Judul: Peterson Field Guides: Insects, Penulis: White RE Borror DJ, Tahun: 1970, Kota: Boston, Penerbit: Houghton Mifflin",
    options: [
      "Peterson Field Guides: Insects. Borror DJ, White RE. 1970. Boston: Houghton Mifflin",
      "Borror DJ, White RE. 1970. Peterson Field Guides: Insects. Boston: Houghton Mifflin",
      "White RE, Borror DJ. 1970. Peterson Field Guides: Insects. Boston: Houghton Mifflin",
      "Borror DJ, White RE. 1970. Boston: Houghton Mifflin Peterson Field Guides: Insects."
    ],
    correct: "Borror DJ, White RE. 1970. Peterson Field Guides: Insects. Boston: Houghton Mifflin"
  },
  {
    subject: "indonesia",
    question: "Teks yang berisikan humor atau kelucuan serta pesan yang diharapkan dapat memberikan pelajaran kepada khalayak disebut..",
    options: ["Komik", "Poster", "Anekdot", "Berita"],
    correct: "Anekdot"
  },
  {
    subject: "indonesia",
    question: "Gaya bahasa yang melukiskan suatu maksud dengan mengatakan kebalikan dari keadaan yang sebenarnya dengan maksud menyindir adalah...",
    options: ["Ironi", "Sinisme", "Sarkasme", "Kritik"],
    correct: "Ironi"
  },
  {
    subject: "indonesia",
    question: "Mana yang merupakan contoh gaya bahasa sinisme dalam teks anekdot?",
    options: [
      "Untuk apa punya banyak uang jika makan saja harus diatur timbangannya. Biar sewa, yang penting keren",
      "Harga kedelai murah sekali sampai pabrik tahu dan tempe tutup karenanya",
      "Sudah tahu tidak punya uang, masih saja ingin pergi liburan. Jangan mimpi!",
      "Tidak punya impian itu sama saja seperti tidak hidup"
    ],
    correct: "Untuk apa punya banyak uang jika makan saja harus diatur timbangannya. Biar sewa, yang penting keren"
  },
  {
    subject: "indonesia",
    question: "Siapa lagi kalau bukan para pejabat kaya. Sudah punya banyak uang, tetap saja korupsi. Dasar serakah! Gaya bahasa yang digunakan dalam ungkapan tersebut adalah...",
    options: ["Ironi", "Sinisme", "Sarkasme", "Aliterasi"],
    correct: "Sarkasme"
  },
  {
    subject: "indonesia",
    question: "Karya sastra lama Melayu berbentuk prosa yang berisi cerita, undang-undang, dan silsilah bersifat rekaan, keagamaan, historis, biografis, atau gabungan sifat-sifat disebut...",
    options: ["Dongeng", "Novel", "Hikayat", "Komik", "Cerpen"],
    correct: "Hikayat"
  },
  {
    subject: "indonesia",
    question: "Perbedaan antara cerpen dan hikayat adalah...",
    options: [
      "Cerpen menceritakan kisah seorang tokoh",
      "Hikayat alurnya maju sedangkan cerpen lebih variatif",
      "Cerpen menggunakan satu sudut pandang",
      "Hikayat menggunakan beragam sudut pandang"
    ],
    correct: "Hikayat alurnya maju sedangkan cerpen lebih variatif"
  },
  {
    subject: "indonesia",
    question: "Contoh dari konjungsi urutan yang biasanya terdapat dalam cerpen atau hikayat adalah..",
    options: ["Sedangkan", "Pada awalnya", "Daripada", "Yang"],
    correct: "Pada awalnya"
  },
  {
    subject: "indonesia",
    question: "Teks laporan hasil observasi adalah teks yang berisi penjelasan dan didasarkan pada...",
    options: ["Penulisan", "Penilaian", "Pengamatan", "Peluang", "Koreksi"],
    correct: "Pengamatan"
  },
  {
    subject: "indonesia",
    question: "Penulisan dalam teks laporan hasil observasi harus berdasarkan...",
    options: ["Fakta", "Opini", "Argumen", "Pendapat"],
    correct: "Fakta"
  },
  {
    subject: "indonesia",
    question: "Bagian yang berisi penjelasan dari pembuka atau pengantar dari topik yang akan dibahas dalam teks laporan hasil observasi adalah ...",
    options: ["Bagian isi", "Simpulan", "Deskripsi manfaat", "Deskripsi umum"],
    correct: "Bagian isi"
  },
  {
    subject: "indonesia",
    question: "Hal yang biasanya dianalisis dalam perdebatan adalah....",
    options: [
      "Isu yang sedang berkembang di masyarakat",
      "Kekuatan dan kelemahan pendapat dari pihak-pihak yang sedang debat",
      "Kabijakan para juri",
      "Mosi dalam pelaksanaan debat"
    ],
    correct: "Kekuatan dan kelemahan pendapat dari pihak-pihak yang sedang debat"
  },
  {
    subject: "indonesia",
    question: "Salah satu cara menyusun pendapat yang disertai argumen adalah....",
    options: [
      "Mencari informasi yang berkaitan dengan isu atau permasalahan tersebut",
      "Menggali informasi berdasarkan satu sumber saja",
      "Menentukan mosi secara kuat",
      "Menindaklanjuti informasi yang berkaitan dengan isu"
    ],
    correct: "Mencari informasi yang berkaitan dengan isu atau permasalahan tersebut"
  },
  {
    subject: "indonesia",
    question: "Penarikan simpulan secara generalisasi dapat berpangkal pada....",
    options: [
      "Garis besar yang ada dalam sebuah debat",
      "Penalaran yang bersifat logis",
      "Pernyataan-pernyataan yang bersifat umum",
      "Pernyataan-pernyataan yang bersifat khusus"
    ],
    correct: "Pernyataan-pernyataan yang bersifat umum"
  },
  {
    subject: "indonesia",
    question: "Berikut merupakan faktor yang memengaruhi keberhasilan negosiasi, kecuali....",
    options: [
      "Perlunya sebuah kesepakatan antara kedua belah pihak",
      "Harus didasari dengan keinginan yang kuat",
      "Kesepakatan yang dicapai bersifat praktis",
      "Harus didasari dengan alasan yang kuat"
    ],
    correct: "Harus didasari dengan keinginan yang kuat"
  },
  {
    subject: "indonesia",
    question: "Unsur-unsur yang harus ada dalam surat penawaran adalah....",
    options: [
      "Kop surat, logo, nomor, dan salam penutup",
      "Tanggal surat, hal, lampiran, dan salam pembuka",
      "Hal, salam pembuka, dan salam penutup",
      "Kop surat, salam pembuka, tubuh surat, dan salam penutup"
    ],
    correct: "Kop surat, logo, nomor, dan salam penutup"
  },
  {
    subject: "indonesia",
    question: "Bacalah penggalan teks negosiasi berikut! Pembeli : “Mas, saya ingin beli notebook, apakah ada?” Struktur yang membangun teks tersebut adalah....",
    options: ["Penawaran", "Pengajuan", "Persetujuan", "Kesimpulan"],
    correct: "Pengajuan"
  },
  {
    subject: "indonesia",
    question: "Hal apa yang terutama diceritakan dalam teks biografi?",
    options: [
      "Fakta-fakta sejarah",
      "Kehidupan dan pencapaian individu",
      "Cerita fiksi tentang tokoh terkenal",
      "Sebuah analisis kritis tentang masa lalu",
      "Berisi cerita fiksi tradisional"
    ],
    correct: "Kehidupan dan pencapaian individu"
  },
  {
    subject: "indonesia",
    question: "Apa yang membedakan teks biografi dengan teks autobiografi?",
    options: [
      "Teks biografi ditulis oleh orang lain tentang seseorang, sementara teks autobiografi ditulis oleh subjeknya sendiri",
      "Teks biografi selalu berisi fiksi, sementara teks autobiografi berisi fakta",
      "Teks biografi hanya berfokus pada masa kecil tokoh, sementara teks autobiografi berfokus pada masa dewasa",
      "Teks biografi hanya berisi pujian terhadap subjeknya, sementara teks autobiografi kritis terhadap diri sendiri"
    ],
    correct: "Teks biografi ditulis oleh orang lain tentang seseorang, sementara teks autobiografi ditulis oleh subjeknya sendiri"
  },
  {
    subject: "indonesia",
    question: "Siapakah tokoh yang sering menjadi subjek dalam teks biografi?",
    options: [
      "Tokoh fiksi",
      "Tokoh sejarah yang kurang dikenal",
      "Tokoh terkenal dan berpengaruh",
      "Tokoh yang tidak memiliki prestasi",
      "Tokoh yang viral"
    ],
    correct: "Tokoh terkenal dan berpengaruh"
  },
  {
    subject: "indonesia",
    question: "Bagaimana peran atau sudut pandang penulis dalam menyajikan teks biografi?",
    options: [
      "Hanya sebagai pencerita cerita",
      "Memilih sudut pandang tertentu terhadap subjek biografi",
      "Tidak terlibat dalam cerita sama sekali",
      "Terlibat dalam cerita subjek biografi"
    ],
    correct: "Memilih sudut pandang tertentu terhadap subjek biografi"
  },
  {
    subject: "indonesia",
    question: "Apa yang membedakan puisi dari jenis tulisan lainnya?",
    options: [
      "Puisi selalu berisi cerita fiksi",
      "Puisi selalu berisi kata-kata yang sulit dimengerti",
      "Puisi menggunakan bahasa yang kreatif dan ekspresif untuk mengungkapkan emosi dan ide",
      "Puisi selalu memiliki struktur yang jelas"
    ],
    correct: "Puisi menggunakan bahasa yang kreatif dan ekspresif untuk mengungkapkan emosi dan ide"
  },
  {
    subject: "indonesia",
    question: "Berapakah struktur baris dan bait yang umum dijumpai dalam sebuah pantun?",
    options: [
      "Empat baris per bait dan tiga bait",
      "Empat baris per bait dan empat bait",
      "Empat baris per bait dan lima bait",
      "Tiga baris per bait dan tiga bait"
    ],
    correct: "Empat baris per bait dan lima bait"
  },

  // --- BIOLOGI (10 Soal) ---
  {
    subject: "biologi",
    question: "Organel sel yang berfungsi sebagai pusat respirasi seluler dan pembentukan ATP adalah...",
    options: ["Mitokondria", "Ribosom", "Badan Golgi", "Lisosom"],
    correct: "Mitokondria"
  },
  {
    subject: "biologi",
    question: "Proses pembuatan zat makanan oleh tumbuhan berklorofil dengan energi cahaya matahari disebut...",
    options: ["Respirasi", "Fotosintesis", "Fermentasi", "Transpirasi"],
    correct: "Fotosintesis"
  },
  {
    subject: "biologi",
    question: "Jaringan tumbuhan yang sel-selnya aktif membelah secara mitosis disebut...",
    options: ["Meristem", "Parenkim", "Kolenkim", "Epidermis"],
    correct: "Meristem"
  },
  {
    subject: "biologi",
    question: "Enzim yang dihasilkan oleh lambung manusia untuk memecah protein menjadi pepton adalah...",
    options: ["Pepsin", "Amilase", "Lipase", "Tripsin"],
    correct: "Pepsin"
  },
  {
    subject: "biologi",
    question: "Golongan darah pada manusia yang dikenal sebagai resipien universal adalah...",
    options: ["AB", "A", "B", "O"],
    correct: "AB"
  },
  {
    subject: "biologi",
    question: "Bagian neuron yang berfungsi menerima rangsangan impuls dari sel saraf lain adalah...",
    options: ["Dendrit", "Akson", "Nodus Ranvier", "Selubung Mielin"],
    correct: "Dendrit"
  },
  {
    subject: "biologi",
    question: "Hubungan simbiosis antara lebah dan bunga tanaman tergolong dalam simbiosis...",
    options: ["Mutualisme", "Komensalisme", "Parasitisme", "Amensalisme"],
    correct: "Mutualisme"
  },
  {
    subject: "biologi",
    question: "Proses pembentukan sperma pada testis pria dinamakan...",
    options: ["Spermatogenesis", "Oogenesis", "Ovulasi", "Fertilisasi"],
    correct: "Spermatogenesis"
  },
  {
    subject: "biologi",
    question: "Hormon pada tumbuhan yang berperan merangsang pematangan buah adalah...",
    options: ["Gas Etilen", "Auksin", "Giberelin", "Sitokinin"],
    correct: "Gas Etilen"
  },
  {
    subject: "biologi",
    question: "Basa nitrogen pirimidin yang hanya ada pada RNA dan menggantikan timin adalah...",
    options: ["Urasil", "Adenin", "Guanin", "Sitosin"],
    correct: "Urasil"
  },

  // --- KIMIA (10 Soal) ---
  {
    subject: "kimia",
    question: "Partikel subatomik yang berada di dalam inti atom dan bermuatan positif adalah...",
    options: ["Proton", "Elektron", "Neutron", "Positron"],
    correct: "Proton"
  },
  {
    subject: "kimia",
    question: "Larutan yang memiliki nilai pH kurang dari 7 dikelompokkan sebagai larutan...",
    options: ["Asam", "Basa", "Netral", "Garam"],
    correct: "Asam"
  },
  {
    subject: "kimia",
    question: "Ikatan kimia yang terjadi karena serah terima elektron antara atom logam dan nonlogam adalah...",
    options: ["Ikatan Ion", "Ikatan Kovalen", "Ikatan Logam", "Ikatan Hidrogen"],
    correct: "Ikatan Ion"
  },
  {
    subject: "kimia",
    question: "Simbol unsur kimia dari Emas dalam sistem periodik unsur adalah...",
    options: ["Au", "Ag", "Fe", "Cu"],
    correct: "Au"
  },
  {
    subject: "kimia",
    question: "Bilangan oksidasi atom oksigen dalam senyawa air (H2O) adalah...",
    options: ["-2", "-1", "+1", "+2"],
    correct: "-2"
  },
  {
    subject: "kimia",
    question: "Reaksi kimia yang melepaskan kalor atau panas ke lingkungan sekitarnya disebut reaksi...",
    options: ["Eksoterm", "Endoterm", "Reduksi", "Oksidasi"],
    correct: "Eksoterm"
  },
  {
    subject: "kimia",
    question: "Unsur-unsur yang terletak pada golongan VIIIA tabel periodik disebut kelompok...",
    options: ["Gas Mulia", "Halogen", "Alkali", "Alkali Tanah"],
    correct: "Gas Mulia"
  },
  {
    subject: "kimia",
    question: "Rumus molekul untuk senyawa asam sulfat adalah...",
    options: ["H2SO4", "HCl", "HNO3", "CH3COOH"],
    correct: "H2SO4"
  },
  {
    subject: "kimia",
    question: "Campuran homogen antara dua zat atau lebih tanpa bidang batas disebut...",
    options: ["Larutan", "Suspensi", "Koloid", "Emulsi"],
    correct: "Larutan"
  },
  {
    subject: "kimia",
    question: "Hukum dasar kimia yang menyatakan bahwa massa zat sebelum dan sesudah reaksi adalah sama dikemukakan oleh...",
    options: ["Antoine Lavoisier", "John Dalton", "Joseph Proust", "Amedeo Avogadro"],
    correct: "Antoine Lavoisier"
  },

  // --- FISIKA (10 Soal) ---
  {
    subject: "fisika",
    question: "Satuan internasional (SI) untuk besaran gaya adalah...",
    options: ["Newton", "Joule", "Watt", "Pascal"],
    correct: "Newton"
  },
  {
    subject: "fisika",
    question: "Hukum Newton yang menjelaskan bahwa percepatan sebanding dengan gaya total dan berbanding terbalik dengan massa adalah...",
    options: ["Hukum II Newton", "Hukum I Newton", "Hukum III Newton", "Hukum Pascal"],
    correct: "Hukum II Newton"
  },
  {
    subject: "fisika",
    question: "Bentuk energi yang tersimpan pada suatu benda karena ketinggian kedudukannya adalah energi...",
    options: ["Potensial", "Kinetik", "Mekanik", "Kalor"],
    correct: "Potensial"
  },
  {
    subject: "fisika",
    question: "Nilai kecepatan cahaya saat merambat dalam ruang hampa udara adalah mendekati...",
    options: ["3 x 10^8 m/s", "3 x 10^6 m/s", "3 x 10^5 km/s", "3 x 10^7 m/s"],
    correct: "3 x 10^8 m/s"
  },
  {
    subject: "fisika",
    question: "Persamaan Hukum Ohm yang menghubungkan tegangan (V), kuat arus (I), dan hambatan (R) adalah...",
    options: ["V = I x R", "I = V x R", "V = I / R", "R = V x I"],
    correct: "V = I x R"
  },
  {
    subject: "fisika",
    question: "Perubahan wujud zat dari cair menjadi gas akibat penyerapan panas disebut...",
    options: ["Menguap", "Membeku", "Menyublim", "Mengembun"],
    correct: "Menguap"
  },
  {
    subject: "fisika",
    question: "Jenis cermin yang bayangannya selalu bersifat maya, tegak, dan diperkecil pada jarak berapa pun adalah...",
    options: ["Cermin Cembung", "Cermin Cekung", "Cermin Datar", "Lensa Cekung"],
    correct: "Cermin Cembung"
  },
  {
    subject: "fisika",
    question: "Jika sebuah lampu diberi tegangan 220 Volt dan arus 0,5 Ampere, daya listrik yang dihasilkan adalah...",
    options: ["110 Watt", "220 Watt", "440 Watt", "55 Watt"],
    correct: "110 Watt"
  },
  {
    subject: "fisika",
    question: "Gelombang yang arah getarannya tegak lurus dengan arah rambatnya disebut gelombang...",
    options: ["Transversal", "Longitudinal", "Elektromagnetik", "Mekanik"],
    correct: "Transversal"
  },
  {
    subject: "fisika",
    question: "Alat ukur yang dirancang khusus untuk mengukur besarnya kuat arus listrik dalam rangkaian adalah...",
    options: ["Amperemeter", "Voltmeter", "Ohmmeter", "Barometer"],
    correct: "Amperemeter"
  },

  // --- SOSIOLOGI (10 Soal) ---
  {
    subject: "sosiologi",
    question: "Tokoh yang dijuluki sebagai 'Bapak Sosiologi' karena pertama kali menggunakan istilah sosiologi adalah...",
    options: ["Auguste Comte", "Emile Durkheim", "Karl Marx", "Max Weber"],
    correct: "Auguste Comte"
  },
  {
    subject: "sosiologi",
    question: "Pencampuran dua kebudayaan yang melahirkan kebudayaan baru tanpa melenyapkan kebudayaan aslinya dinamakan...",
    options: ["Akulturasi", "Asimilasi", "Difusi", "Akomodasi"],
    correct: "Akulturasi"
  },
  {
    subject: "sosiologi",
    question: "Tipe tindakan sosial yang dilakukan atas dasar adat atau kebiasaan turun-temurun menurut Max Weber adalah...",
    options: ["Tindakan Tradisional", "Tindakan Afektif", "Tindakan Rasional Nilai", "Tindakan Rasional Instrumental"],
    correct: "Tindakan Tradisional"
  },
  {
    subject: "sosiologi",
    question: "Bentuk stratifikasi sosial tertutup di mana kedudukan individu tidak dapat berpindah strata ditentukan oleh...",
    options: ["Sistem Kasta", "Kelas Ekonomi", "Tingkat Pendidikan", "Prestasi Kerja"],
    correct: "Sistem Kasta"
  },
  {
    subject: "sosiologi",
    question: "Bentuk proses interaksi sosial yang berujung pada pertentangan atau kompetisi negatif disebut hubungan...",
    options: ["Disosiatif", "Asosiatif", "Kooperatif", "Akomodatif"],
    correct: "Disosiatif"
  },
  {
    subject: "sosiologi",
    question: "Proses individu mempelajari dan menginternalisasi nilai serta norma kehidupan bermasyarakat disebut...",
    options: ["Sosialisasi", "Modernisasi", "Globalisasi", "Enkulturasi"],
    correct: "Sosialisasi"
  },
  {
    subject: "sosiologi",
    question: "Agen sosialisasi primer yang paling awal membentuk kepribadian dan karakter anak adalah...",
    options: ["Keluarga", "Sekolah", "Kelompok Teman Sebaya", "Media Massa"],
    correct: "Keluarga"
  },
  {
    subject: "sosiologi",
    question: "Penyimpangan sosial yang dilakukan berulang kali hingga pelaku dicap oleh masyarakat luas disebut penyimpangan...",
    options: ["Sekunder", "Primer", "Positif", "Individu"],
    correct: "Sekunder"
  },
  {
    subject: "sosiologi",
    question: "Sikap yang memandang kebudayaan kelompok sendiri lebih superior dibandingkan kebudayaan kelompok lain disebut...",
    options: ["Etnosentrisme", "Relativisme Kebudayaan", "Xenosentrisme", "Primordialisme"],
    correct: "Etnosentrisme"
  },
  {
    subject: "sosiologi",
    question: "Dampak atau fungsi lembaga sosial yang tidak diinginkan dan tidak disadari oleh para anggotanya disebut fungsi...",
    options: ["Laten", "Manifes", "Primer", "Struktural"],
    correct: "Laten"
  },

  // --- MATEMATIKA (10 Soal) ---
  {
    subject: "matematika",
    question: "Hasil penyederhanaan dari bentuk eksponen 2^5 * 2^3 adalah...",
    options: ["2^8", "2^15", "4^8", "4^15"],
    correct: "2^8"
  },
  {
    subject: "matematika",
    question: "Akar-akar dari persamaan kuadrat x^2 - 5x + 6 = 0 adalah...",
    options: ["x = 2 atau x = 3", "x = -2 atau x = -3", "x = 1 atau x = 6", "x = -1 atau x = -6"],
    correct: "x = 2 atau x = 3"
  },
  {
    subject: "matematika",
    question: "Diketahui barisan aritmetika dengan suku pertama a = 3 dan beda b = 4. Nilai suku ke-10 (U10) adalah...",
    options: ["39", "43", "36", "40"],
    correct: "39"
  },
  {
    subject: "matematika",
    question: "Turunan pertama f'(x) dari fungsi f(x) = 3x^2 + 4x - 5 adalah...",
    options: ["6x + 4", "3x + 4", "6x^2 + 4", "6x - 5"],
    correct: "6x + 4"
  },
  {
    subject: "matematika",
    question: "Nilai perbandingan trigonometri sin(30°) adalah...",
    options: ["1/2", "√2/2", "√3/2", "1"],
    correct: "1/2"
  },
  {
    subject: "matematika",
    question: "Luas sebuah lingkaran dengan jari-jari r = 7 cm (menggunakan π = 22/7) adalah...",
    options: ["154 cm^2", "616 cm^2", "44 cm^2", "88 cm^2"],
    correct: "154 cm^2"
  },
  {
    subject: "matematika",
    question: "Berapa banyak susunan kata berbeda yang dapat dibentuk dari huruf-huruf kata 'KATA'?",
    options: ["12", "24", "6", "48"],
    correct: "12"
  },
  {
    subject: "matematika",
    question: "Nilai determinan dari matriks 2x2 [[3, 2], [1, 4]] adalah...",
    options: ["10", "14", "12", "8"],
    correct: "10"
  },
  {
    subject: "matematika",
    question: "Nilai median dari deretan data: 4, 7, 2, 8, 9, 5, 6 adalah...",
    options: ["6", "5", "7", "8"],
    correct: "6"
  },
  {
    subject: "matematika",
    question: "Hasil dari integral tak tentu ∫(2x + 3) dx adalah...",
    options: ["x^2 + 3x + C", "2x^2 + 3x + C", "x^2 + C", "2x^2 + C"],
    correct: "x^2 + 3x + C"
  }
];

module.exports = {
  SEED_QUESTIONS
};


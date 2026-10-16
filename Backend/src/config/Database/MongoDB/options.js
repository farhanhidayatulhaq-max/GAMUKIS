module.exports = {
  autoIndex: process.env.NODE_ENV !== 'production', // Matikan di production demi performa
  maxPoolSize: 10,                 // Jumlah maksimal socket koneksi paralel
  serverSelectionTimeoutMS: 5000,  // Waktu tunggu memilih server DB sebelum timeout
  socketTimeoutMS: 45000,          // Waktu tunggu inaktivitas socket
  family: 4                        // Menggunakan IPv4 saja untuk menghindari delay resolver IPv6
};
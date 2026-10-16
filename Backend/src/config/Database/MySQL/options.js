module.exports = {
  // 1. Dialect & Driver Specification
  dialect: 'mysql',
  dialectModule: require('mysql2'), // Memastikan driver mysql2 terpakai secara eksplisit

  // 2. Timezone Configuration (Sequelize Level)
  // Menyelaraskan timezone query Sequelize dengan zona waktu lokal (contoh: WIB / +07:00)
  timezone: '+07:00',

  // 3. Dialect Options (Driver Engine Level / mysql2)
  dialectOptions: {
    // Memaksa MySQL mengembalikan tipe data DATE/DATETIME sebagai STRING
    // Mencegah konversi otomatis Node.js ke ISO UTC Date Object yang berpotensi menggeser jam
    dateStrings: true,
    typeCast: function (field, next) {
      if (field.type === 'DATETIME' || field.type === 'TIMESTAMP' || field.type === 'DATE') {
        return field.string(); // Mengembalikan format 'YYYY-MM-DD HH:mm:ss' persis dari DB
      }
      return next();
    },

    // Session-level timezone initialization (memastikan server MySQL menggunakan zona waktu yang sama)
    timezone: '+07:00',

    // Network & Connection Resilience
    connectTimeout: 60000 // Timeout 60 detik untuk toleransi saat booting di Docker
  },

  // 4. Connection Pooling Configuration
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // 5. Query Logging & Resilience
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  retry: {
    max: 5
  }
};
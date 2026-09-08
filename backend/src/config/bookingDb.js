const mongoose = require('mongoose');

let bookingDbConnection = null;

async function connectBookingDB() {
  if (bookingDbConnection && bookingDbConnection.readyState === 1) {
    return bookingDbConnection;
  }
  const uri = process.env.BOOKING_MONGODB_URI || process.env.MONGODB_URI;
  const conn = mongoose.createConnection(uri, { dbName: 'ft_booking_system' });
  bookingDbConnection = await conn.asPromise();
  console.log('Connected to ft_booking_system (Booking DB)');
  return bookingDbConnection;
}

function getBookingDB() {
  return bookingDbConnection;
}

module.exports = { connectBookingDB, getBookingDB };

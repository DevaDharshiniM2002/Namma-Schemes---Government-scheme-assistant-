const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Scheme = require('../models/Scheme');

async function clearSchemes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const count = await Scheme.countDocuments();
    console.log('Found ' + count + ' schemes');

    if (count > 0) {
      await Scheme.deleteMany({});
      console.log('Deleted all ' + count + ' schemes');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

clearSchemes();

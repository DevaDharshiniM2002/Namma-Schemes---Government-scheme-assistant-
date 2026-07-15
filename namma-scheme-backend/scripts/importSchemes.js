const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Scheme = require('../models/Scheme');

async function importSchemes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check if schemes already exist
    const count = await Scheme.countDocuments();
    if (count > 0) {
      console.log(`✓ Database already has ${count} schemes`);
      console.log('Skipping import. To reimport, delete existing schemes first.');
      await mongoose.disconnect();
      return;
    }

    // Read CSV file
    const csvPath = path.join(__dirname, '../data/myscheme_cleaned.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('✗ CSV file not found:', csvPath);
      await mongoose.disconnect();
      return;
    }

    console.log('Reading CSV file...');
    const schemes = [];
    let rowCount = 0;

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        schemes.push({
          scheme_name: row.scheme_name || '',
          slug: row.slug || '',
          details: row.details || '',
          benefits: row.benefits || '',
          eligibility: row.eligibility || '',
          application: row.application || '',
          documents: row.documents || '',
          level: row.level || 'Central',
          schemeCategory: row.schemeCategory || '',
          tags: row.tags || '',
          portal_url: `https://www.myscheme.gov.in/schemes/${row.slug || ''}`,
        });

        if (rowCount % 500 === 0) {
          console.log(`  Processed ${rowCount} rows...`);
        }
      })
      .on('end', async () => {
        try {
          console.log(`\n✓ CSV parsed: ${schemes.length} schemes ready to import`);
          
          // Insert all schemes
          console.log('Inserting schemes into MongoDB...');
          const result = await Scheme.insertMany(schemes, { ordered: false });
          
          console.log(`\n✓ Successfully imported ${result.length} schemes!`);
          console.log(`Total schemes in database: ${await Scheme.countDocuments()}`);
          
          await mongoose.disconnect();
          console.log('✓ Disconnected from MongoDB');
        } catch (err) {
          console.error('✗ Error inserting schemes:', err.message);
          await mongoose.disconnect();
          process.exit(1);
        }
      })
      .on('error', (err) => {
        console.error('✗ Error reading CSV:', err.message);
        process.exit(1);
      });
  } catch (err) {
    console.error('✗ Connection error:', err.message);
    process.exit(1);
  }
}

importSchemes();

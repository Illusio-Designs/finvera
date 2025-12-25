/**
 * Script to import HSN/SAC master data from CSV file
 * 
 * Usage:
 *   node src/scripts/importHSNData.js <path-to-csv-file>
 * 
 * CSV Format Expected:
 *   code,item_type,chapter_code,heading_code,subheading_code,tariff_item,technical_description,trade_description,gst_rate,cess_rate,uqc_code,effective_from
 * 
 * Example:
 *   1001,GOODS,10,1001,,,Wheat and meslin,Wheat,0.0,,KGS,2024-01-01
 *   9983,SERVICES,,,,,Other professional technical and business services,Professional services,18.0,,,2024-01-01
 * 
 * To get official HSN/SAC data:
 * 1. Visit GST Portal: https://www.gst.gov.in/
 * 2. Navigate to "Search HSN" (available pre and post login)
 * 3. Download the HSN directory in Excel format
 * 4. Convert to CSV with required columns
 * 5. Run this script to import
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const masterModels = require('../models/masterModels');
const logger = require('../utils/logger');

async function importHSNFromCSV(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    logger.info(`Reading HSN/SAC data from: ${filePath}`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const rows = [];
    let isFirstLine = true;
    let headers = [];

    for await (const line of rl) {
      if (isFirstLine) {
        headers = line.split(',').map(h => h.trim());
        isFirstLine = false;
        continue;
      }

      const values = parseCSVLine(line);
      if (values.length === 0) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || null;
      });

      // Validate required fields
      if (!row.code || !row.item_type || !row.technical_description) {
        logger.warn(`Skipping invalid row: missing required fields`);
        continue;
      }

      // Normalize data
      const hsnRow = {
        code: row.code.trim(),
        item_type: row.item_type.toUpperCase() === 'SERVICES' ? 'SERVICES' : 'GOODS',
        chapter_code: row.chapter_code || null,
        heading_code: row.heading_code || null,
        subheading_code: row.subheading_code || null,
        tariff_item: row.tariff_item || null,
        technical_description: row.technical_description.trim(),
        trade_description: row.trade_description || null,
        gst_rate: row.gst_rate ? parseFloat(row.gst_rate) : null,
        cess_rate: row.cess_rate ? parseFloat(row.cess_rate) : null,
        uqc_code: row.uqc_code || null,
        effective_from: row.effective_from || null,
        is_active: row.is_active !== undefined ? row.is_active === 'true' || row.is_active === true : true,
      };

      rows.push(hsnRow);
    }

    if (rows.length === 0) {
      logger.warn('No valid rows found in CSV file');
      return;
    }

    logger.info(`Parsed ${rows.length} HSN/SAC records`);

    // Import in batches to avoid memory issues
    const batchSize = 1000;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      try {
        const result = await masterModels.HSNSAC.bulkCreate(batch, {
          ignoreDuplicates: true,
          updateOnDuplicate: [
            'technical_description',
            'trade_description',
            'gst_rate',
            'cess_rate',
            'uqc_code',
            'effective_from',
            'is_active',
            'updatedAt',
          ],
        });
        imported += batch.length;
        logger.info(`Imported batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      } catch (error) {
        logger.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        skipped += batch.length;
      }
    }

    logger.info(`\n✅ Import Summary:`);
    logger.info(`   Imported: ${imported} records`);
    logger.info(`   Skipped/Errors: ${skipped} records`);
    logger.info(`   Total processed: ${rows.length} records`);

  } catch (error) {
    logger.error('Error importing HSN data:', error);
    process.exit(1);
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Run if called directly
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node src/scripts/importHSNData.js <path-to-csv-file>');
    console.error('\nCSV Format Expected:');
    console.error('code,item_type,chapter_code,heading_code,subheading_code,tariff_item,technical_description,trade_description,gst_rate,cess_rate,uqc_code,effective_from');
    console.error('\nTo get official data:');
    console.error('1. Visit GST Portal: https://www.gst.gov.in/');
    console.error('2. Navigate to "Search HSN"');
    console.error('3. Download HSN directory in Excel');
    console.error('4. Convert to CSV and run this script');
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  importHSNFromCSV(absolutePath)
    .then(() => {
      logger.info('\n✅ Import completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importHSNFromCSV };

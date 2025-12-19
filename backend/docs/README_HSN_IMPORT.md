# HSN/SAC Master Data Import Guide

This guide explains how to import the complete official HSN/SAC master data from the Indian GST department.

## Getting Official HSN/SAC Data

### Option 1: From GST Portal (Recommended)
1. Visit the official GST Portal: https://www.gst.gov.in/
2. Navigate to **"Search HSN"** (available both pre-login and post-login)
3. Click on **"Download HSN Directory"** 
4. Download the Excel file containing all HSN/SAC codes
5. Convert the Excel file to CSV format
6. Ensure the CSV has the following columns:
   - `code` - HSN/SAC code
   - `item_type` - GOODS or SERVICES
   - `chapter_code` - Chapter code (for goods)
   - `heading_code` - Heading code (for goods)
   - `subheading_code` - Subheading code (optional)
   - `tariff_item` - Tariff item (optional)
   - `technical_description` - Official technical description
   - `trade_description` - Common trade name (optional)
   - `gst_rate` - GST rate percentage
   - `cess_rate` - Cess rate percentage (optional)
   - `uqc_code` - Unit Quantity Code (e.g., NOS, KGS, LTR)
   - `effective_from` - Effective date (YYYY-MM-DD format)

### Option 2: Using API Services
- FastGST API: https://fastgst.in/ (provides HSN/SAC lookup API)
- You can write a script to fetch and import data from their API

## Importing Data

### Using the Import Script

Once you have the CSV file, run:

```bash
cd backend
node src/scripts/importHSNData.js path/to/hsn_data.csv
```

Example:
```bash
node src/scripts/importHSNData.js /Users/Downloads/gst_hsn_directory.csv
```

### CSV Format Example

```csv
code,item_type,chapter_code,heading_code,subheading_code,tariff_item,technical_description,trade_description,gst_rate,cess_rate,uqc_code,effective_from
1001,GOODS,10,1001,,,Wheat and meslin,Wheat,0.0,,KGS,2024-01-01
6109,GOODS,61,6109,,,T-shirts singlets and other vests knitted or crocheted,T-shirts,12.0,,NOS,2024-01-01
9983,SERVICES,,,,,Other professional technical and business services,Professional Services,18.0,,,2024-01-01
```

### Bulk Import Features

The import script:
- Handles CSV files with quoted fields
- Imports data in batches of 1000 records (to avoid memory issues)
- Skips duplicate codes (uses `ignoreDuplicates: true`)
- Updates existing records if they already exist
- Provides progress logging
- Shows import summary at the end

## Current Seeded Data

The system currently seeds a comprehensive set of commonly used HSN/SAC codes (100+ codes) covering:
- Common goods across all chapters
- Common services (SAC codes)
- Various GST rates (0%, 5%, 12%, 18%, 28%)
- Proper UQC codes

## Verification

After importing, verify the data:

```sql
-- Check total count
SELECT COUNT(*) FROM hsn_sac_master;

-- Check by type
SELECT item_type, COUNT(*) as count FROM hsn_sac_master GROUP BY item_type;

-- Check GST rates distribution
SELECT gst_rate, COUNT(*) as count FROM hsn_sac_master GROUP BY gst_rate ORDER BY gst_rate;
```

## Notes

- The official GST HSN directory is updated periodically
- It's recommended to refresh the data annually or when GST rates change
- Always backup your database before bulk imports
- The import script uses transactions and handles errors gracefully

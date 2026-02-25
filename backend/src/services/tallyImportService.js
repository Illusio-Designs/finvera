const xml2js = require('xml2js');
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Tally Import Service
 * Handles importing data from Tally accounting software
 * Supports: Tally XML, Excel, CSV formats
 */
class TallyImportService {
  /**
   * Strip BOM (Byte Order Mark) from string
   */
  stripBOM(str) {
    // UTF-8 BOM: EF BB BF
    if (str.charCodeAt(0) === 0xFEFF) {
      return str.slice(1);
    }
    // UTF-16 BE BOM: FE FF
    if (str.charCodeAt(0) === 0xFEFF || (str.length > 1 && str.charCodeAt(0) === 0xFE && str.charCodeAt(1) === 0xFF)) {
      return str.slice(1);
    }
    // UTF-16 LE BOM: FF FE
    if (str.length > 1 && str.charCodeAt(0) === 0xFF && str.charCodeAt(1) === 0xFE) {
      return str.slice(2);
    }
    return str;
  }

  /**
   * Detect and read file with proper encoding
   */
  readFileWithEncoding(filePath) {
    try {
      // First, try reading as buffer to detect encoding
      const buffer = fs.readFileSync(filePath);
      
      // Check for UTF-8 BOM (EF BB BF)
      if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        logger.info('Detected UTF-8 BOM, stripping...');
        return buffer.slice(3).toString('utf8');
      }
      
      // Check for UTF-16 LE BOM (FF FE)
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        logger.info('Detected UTF-16 LE BOM, converting...');
        return buffer.slice(2).toString('utf16le');
      }
      
      // Check for UTF-16 BE BOM (FE FF)
      if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        logger.info('Detected UTF-16 BE BOM, converting...');
        // Convert UTF-16 BE to UTF-8
        let utf16String = '';
        for (let i = 2; i < buffer.length; i += 2) {
          const byte1 = buffer[i];
          const byte2 = buffer[i + 1] || 0;
          const charCode = (byte1 << 8) | byte2;
          utf16String += String.fromCharCode(charCode);
        }
        return Buffer.from(utf16String, 'utf16le').toString('utf8');
      }
      
      // Try UTF-8 first (most common)
      let xmlData = buffer.toString('utf8');
      
      // Strip any remaining BOM characters
      xmlData = this.stripBOM(xmlData);
      
      // Remove any leading whitespace or non-XML characters before first tag
      xmlData = xmlData.trim();
      
      // Ensure it starts with <
      if (!xmlData.startsWith('<')) {
        // Find first < character
        const firstTagIndex = xmlData.indexOf('<');
        if (firstTagIndex > 0) {
          logger.warn(`Found ${firstTagIndex} non-XML characters before first tag, removing...`);
          xmlData = xmlData.slice(firstTagIndex);
        }
      }
      
      return xmlData;
    } catch (error) {
      logger.error('Error reading file with encoding detection:', error);
      // Fallback to simple UTF-8 read
      const xmlData = fs.readFileSync(filePath, 'utf8');
      return this.stripBOM(xmlData.trim());
    }
  }

  /**
   * Parse Tally XML file
   */
  async parseTallyXML(filePath) {
    try {
      // Read file with encoding detection and BOM handling
      const xmlData = this.readFileWithEncoding(filePath);
      
      // Validate that we have valid XML
      if (!xmlData || !xmlData.trim().startsWith('<')) {
        throw new Error('File does not appear to be valid XML. File may be empty or corrupted.');
      }
      
      const parser = new xml2js.Parser({ 
        explicitArray: false, 
        mergeAttrs: true,
        trim: true,
        normalize: true,
        explicitRoot: true,  // Changed to true to preserve root element
        ignoreAttrs: false,
        charkey: '_',
        attrkey: '$'
      });
      const result = await parser.parseStringPromise(xmlData);
      
      // Add debugging for XML structure
      logger.info('XML parsing completed');
      logger.info('Root keys:', Object.keys(result));
      if (result.ENVELOPE) {
        logger.info('ENVELOPE keys:', Object.keys(result.ENVELOPE));
        if (result.ENVELOPE.BODY) {
          logger.info('BODY keys:', Object.keys(result.ENVELOPE.BODY));
          if (result.ENVELOPE.BODY.IMPORTDATA) {
            logger.info('IMPORTDATA keys:', Object.keys(result.ENVELOPE.BODY.IMPORTDATA));
            if (result.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA) {
              logger.info('REQUESTDATA keys:', Object.keys(result.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA));
            }
          }
        }
      }
      
      const data = {
        groups: [],
        ledgers: [],
        stockItems: [],
        vouchers: [],
        openingBalances: [],
      };

      // Parse Tally XML structure
      const tallyData = result.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA || {};
      
      // Handle TALLYMESSAGE as array or single object
      let tallyMessages = [];
      if (tallyData.TALLYMESSAGE) {
        tallyMessages = Array.isArray(tallyData.TALLYMESSAGE) 
          ? tallyData.TALLYMESSAGE 
          : [tallyData.TALLYMESSAGE];
        logger.info(`Found ${tallyMessages.length} TALLYMESSAGE elements`);
      } else {
        logger.warn('No TALLYMESSAGE found in XML');
      }
      
      // Extract Groups and Ledgers from TALLYMESSAGE array
      for (const message of tallyMessages) {
        // Extract Groups
        if (message.GROUP) {
          const groups = Array.isArray(message.GROUP) ? message.GROUP : [message.GROUP];
          for (const group of groups) {
            const groupName = group.NAME || group.$ || (group.$ && group.$.NAME);
            data.groups.push({
              name: groupName,
              parent: group.PARENT || null,
              nature: this.mapTallyNatureToFintranzact(groupName),
            });
          }
        }
        
        // Extract Ledgers
        if (message.LEDGER) {
          const ledgers = Array.isArray(message.LEDGER) ? message.LEDGER : [message.LEDGER];
          for (const ledger of ledgers) {
            const ledgerName = ledger.NAME || (ledger.$ && ledger.$.NAME);
            const ledgerParent = ledger.PARENT || ledger.GROUP;
            
            const openingBalance = ledger.OPENINGBALANCE || '0';
            data.ledgers.push({
              name: ledgerName,
              group: ledgerParent,
              address: ledger.ADDRESS || null,
              state: ledger.STATE || null,
              pincode: ledger.PINCODE || null,
              gstin: ledger.GSTIN || null,
              pan: ledger.PAN || null,
              email: ledger.EMAIL || null,
              phone: ledger.PHONE || null,
              openingBalance: this.parseTallyAmount(openingBalance),
              isDefault: ledgerName === 'Cash' || ledgerName === 'Bank',
            });
            
            // Track opening balances separately
            if (openingBalance && openingBalance !== '0') {
              data.openingBalances.push({
                ledgerName: ledgerName,
                amount: this.parseTallyAmount(openingBalance),
                type: this.parseTallyAmount(openingBalance) >= 0 ? 'debit' : 'credit',
              });
            }
          }
        }
        
        // Extract Stock Items
        if (message.STOCKITEM) {
          const stockItems = Array.isArray(message.STOCKITEM) ? message.STOCKITEM : [message.STOCKITEM];
          for (const item of stockItems) {
            data.stockItems.push({
              name: item.$.NAME || item.NAME,
              group: item.PARENT || item.GROUP,
              unit: item.BASEUNIT || item.UNIT || 'NOS',
              hsnCode: item.HSNCODE || null,
              gstRate: item.GSTRATE || 0,
              openingStock: this.parseTallyAmount(item.OPENINGBALANCE || '0'),
              openingValue: this.parseTallyAmount(item.OPENINGVALUE || '0'),
            });
          }
        }
      }
      
      // Log final counts
      logger.info(`Parsed data summary: ${data.groups.length} groups, ${data.ledgers.length} ledgers, ${data.stockItems.length} stock items`);

      // Extract Vouchers from TALLYMESSAGE array
      for (const message of tallyMessages) {
        if (message.VOUCHER) {
          const vouchers = Array.isArray(message.VOUCHER) ? message.VOUCHER : [message.VOUCHER];
          for (const voucher of vouchers) {
            const voucherType = this.mapTallyVoucherType(voucher.$.VOUCHERTYPE || voucher.VOUCHERTYPE);
            data.vouchers.push({
              type: voucherType,
              number: voucher.VOUCHERNUMBER || voucher.$.VOUCHERNUMBER,
              date: this.parseTallyDate(voucher.DATE || voucher.$.DATE),
              party: voucher.PARTYNAME || null,
              narration: voucher.NARRATION || '',
              items: this.parseTallyVoucherEntries(voucher.ENTRIES || []),
              totalAmount: this.calculateVoucherTotal(voucher.ENTRIES || []),
            });
          }
        }
      }

      return data;
    } catch (error) {
      logger.error('Error parsing Tally XML:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('Non-whitespace before first tag')) {
        throw new Error(
          'XML file has encoding issues (BOM or invalid characters). ' +
          'Please ensure the file is saved as UTF-8 without BOM. ' +
          'Original error: ' + error.message
        );
      }
      
      if (error.message.includes('Unexpected end')) {
        throw new Error(
          'XML file appears to be incomplete or corrupted. ' +
          'Please verify the file was uploaded completely. ' +
          'Original error: ' + error.message
        );
      }
      
      throw new Error(`Failed to parse Tally XML: ${error.message}`);
    }
  }

  /**
   * Parse Tally Excel file
   */
  async parseTallyExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const data = {
        groups: [],
        ledgers: [],
        stockItems: [],
        vouchers: [],
        openingBalances: [],
      };

      // Helper function to convert worksheet to JSON
      const sheetToJson = (worksheet) => {
        const rows = [];
        const headerRow = [];
        let firstRow = true;

        worksheet.eachRow((row, rowNumber) => {
          if (firstRow) {
            // First row is headers
            row.eachCell((cell, colNumber) => {
              headerRow[colNumber] = cell.value ? String(cell.value).trim() : '';
            });
            firstRow = false;
          } else {
            // Data rows
            const rowData = {};
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              const header = headerRow[colNumber];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            if (Object.keys(rowData).length > 0) {
              rows.push(rowData);
            }
          }
        });

        return rows;
      };

      // Parse Groups sheet
      const groupsSheet = workbook.getWorksheet('Groups');
      if (groupsSheet) {
        const groupsData = sheetToJson(groupsSheet);
        data.groups = groupsData.map(row => ({
          name: row.Name || row.NAME,
          parent: row.Parent || row.PARENT || null,
          nature: this.mapTallyNatureToFintranzact(row.Name || row.NAME),
        }));
      }

      // Parse Ledgers sheet
      const ledgersSheet = workbook.getWorksheet('Ledgers');
      if (ledgersSheet) {
        const ledgersData = sheetToJson(ledgersSheet);
        data.ledgers = ledgersData.map(row => {
          const openingBalance = parseFloat(row['Opening Balance'] || row.OPENING_BALANCE || 0);
          return {
            name: row.Name || row.NAME,
            group: row.Group || row.GROUP,
            address: row.Address || row.ADDRESS || null,
            state: row.State || row.STATE || null,
            pincode: row.Pincode || row.PINCODE || null,
            gstin: row.GSTIN || row.Gstin || null,
            pan: row.PAN || row.Pan || null,
            email: row.Email || row.EMAIL || null,
            phone: row.Phone || row.PHONE || null,
            openingBalance: openingBalance,
            isDefault: (row.Name || row.NAME) === 'Cash' || (row.Name || row.NAME) === 'Bank',
          };
        });
      }

      // Parse Stock Items sheet
      const stockSheet = workbook.getWorksheet('Stock Items');
      if (stockSheet) {
        const stockData = sheetToJson(stockSheet);
        data.stockItems = stockData.map(row => ({
          name: row.Name || row.NAME,
          group: row.Group || row.GROUP,
          unit: row.Unit || row.UNIT || 'NOS',
          hsnCode: row.HSN || row.HSNCode || null,
          gstRate: row['GST Rate'] || row.GST_RATE ? parseFloat(row['GST Rate'] || row.GST_RATE) : null,
          openingStock: parseFloat(row['Opening Stock'] || row.OPENING_STOCK || 0),
          openingValue: parseFloat(row['Opening Value'] || row.OPENING_VALUE || 0),
        }));
      }

      // Parse Vouchers sheet
      const vouchersSheet = workbook.getWorksheet('Vouchers');
      if (vouchersSheet) {
        const vouchersData = sheetToJson(vouchersSheet);
        data.vouchers = vouchersData.map(row => ({
          type: this.mapTallyVoucherType(row.Type || row.TYPE),
          number: row.Number || row.NUMBER,
          date: this.parseExcelDate(row.Date || row.DATE),
          party: row.Party || row.PARTY || null,
          narration: row.Narration || row.NARRATION || '',
          totalAmount: parseFloat(row.Amount || row.AMOUNT || 0),
        }));
      }

      return data;
    } catch (error) {
      logger.error('Error parsing Tally Excel:', error);
      throw new Error(`Failed to parse Tally Excel: ${error.message}`);
    }
  }

  /**
   * Parse Tally CSV file
   */
  async parseTallyCSV(filePath) {
    return new Promise((resolve, reject) => {
      const data = {
        groups: [],
        ledgers: [],
        stockItems: [],
        vouchers: [],
        openingBalances: [],
      };

      const results = {
        groups: [],
        ledgers: [],
        stockItems: [],
        vouchers: [],
      };

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const type = row.Type || row.TYPE || '';
          if (type.toLowerCase().includes('group')) {
            results.groups.push(row);
          } else if (type.toLowerCase().includes('ledger')) {
            results.ledgers.push(row);
          } else if (type.toLowerCase().includes('stock')) {
            results.stockItems.push(row);
          } else if (type.toLowerCase().includes('voucher')) {
            results.vouchers.push(row);
          }
        })
        .on('end', () => {
          // Process groups
          data.groups = results.groups.map(row => ({
            name: row.Name || row.NAME,
            parent: row.Parent || row.PARENT || null,
            nature: this.mapTallyNatureToFintranzact(row.Name || row.NAME),
          }));

          // Process ledgers
          data.ledgers = results.ledgers.map(row => ({
            name: row.Name || row.NAME,
            group: row.Group || row.GROUP,
            address: row.Address || row.ADDRESS || null,
            state: row.State || row.STATE || null,
            pincode: row.Pincode || row.PINCODE || null,
            gstin: row.GSTIN || null,
            pan: row.PAN || null,
            email: row.Email || row.EMAIL || null,
            phone: row.Phone || row.PHONE || null,
            openingBalance: parseFloat(row['Opening Balance'] || row.OPENING_BALANCE || 0),
            isDefault: (row.Name || row.NAME) === 'Cash' || (row.Name || row.NAME) === 'Bank',
          }));

          // Process stock items
          data.stockItems = results.stockItems.map(row => ({
            name: row.Name || row.NAME,
            group: row.Group || row.GROUP,
            unit: row.Unit || row.UNIT || 'NOS',
            hsnCode: row.HSN || row.HSNCode || null,
            gstRate: row['GST Rate'] || row.GST_RATE ? parseFloat(row['GST Rate'] || row.GST_RATE) : null,
            openingStock: parseFloat(row['Opening Stock'] || row.OPENING_STOCK || 0),
            openingValue: parseFloat(row['Opening Value'] || row.OPENING_VALUE || 0),
          }));

          // Process vouchers
          data.vouchers = results.vouchers.map(row => ({
            type: this.mapTallyVoucherType(row.Type || row.TYPE),
            number: row.Number || row.NUMBER,
            date: this.parseCSVDate(row.Date || row.DATE),
            party: row.Party || row.PARTY || null,
            narration: row.Narration || row.NARRATION || '',
            totalAmount: parseFloat(row.Amount || row.AMOUNT || 0),
          }));

          resolve(data);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        });
    });
  }

  /**
   * Map Tally nature to Fintranzact nature
   */
  mapTallyNatureToFintranzact(tallyGroupName) {
    const name = (tallyGroupName || '').toLowerCase();
    
    // More specific patterns first (to avoid conflicts)
    
    // Sundry Creditors (Liability) - check before general "purchase" check
    if (name.includes('sundry creditors') || name.includes('sundry creditor')) {
      return 'liability';
    }
    
    // Sundry Debtors (Asset) - check before general "sales" check  
    if (name.includes('sundry debtors') || name.includes('sundry debtor')) {
      return 'asset';
    }
    
    // Capital Account (Liability)
    if (name.includes('capital account') || name.includes('capital')) {
      return 'liability';
    }
    
    // Specific Asset Groups
    if (name.includes('current asset') || name.includes('fixed asset') || 
        name.includes('bank') || name.includes('cash') || 
        name.includes('deposits') || name.includes('loans & advances') ||
        name.includes('stock-in-hand') || name.includes('inventory')) {
      return 'asset';
    }
    
    // Specific Liability Groups
    if (name.includes('current liabilities') || name.includes('current liability') || 
        name.includes('duties & taxes') || name.includes('provisions') || 
        name.includes('loan') || name.includes('outstanding') || name.includes('payable')) {
      return 'liability';
    }
    
    // Income Groups (check before sales to avoid conflicts)
    if (name.includes('direct income') || name.includes('indirect income') ||
        name.includes('sales account') || name.includes('revenue') ||
        name.includes('income')) {
      return 'income';
    }
    
    // Expense Groups
    if (name.includes('direct expense') || name.includes('indirect expense') ||
        name.includes('purchase account') || name.includes('expenses')) {
      return 'expense';
    }
    
    // General patterns (less specific)
    if (name.includes('asset')) return 'asset';
    if (name.includes('liability')) return 'liability';
    if (name.includes('sales') && !name.includes('creditor') && !name.includes('debtor')) return 'income';
    if (name.includes('purchase') && !name.includes('creditor') && !name.includes('debtor')) return 'expense';
    
    // Branch/Divisions and other organizational groups
    if (name.includes('branch') || name.includes('division')) {
      return 'asset'; // Usually treated as cost centers under assets
    }
    
    // Default fallback based on common accounting principles
    // If it contains "creditor" → liability
    // If it contains "debtor" → asset  
    // Otherwise → expense (conservative default)
    if (name.includes('creditor')) return 'liability';
    if (name.includes('debtor')) return 'asset';
    
    return 'expense'; // Conservative default
  }

  /**
   * Map Tally voucher type to Fintranzact voucher type
   */
  mapTallyVoucherType(tallyType) {
    const type = (tallyType || '').toLowerCase();
    
    if (type.includes('sales') || type.includes('invoice')) return 'Sales';
    if (type.includes('purchase') || type.includes('bill')) return 'Purchase';
    if (type.includes('payment')) return 'Payment';
    if (type.includes('receipt')) return 'Receipt';
    if (type.includes('journal')) return 'Journal';
    if (type.includes('contra')) return 'Contra';
    if (type.includes('debit note')) return 'Debit Note';
    if (type.includes('credit note')) return 'Credit Note';
    
    return 'Journal'; // Default
  }

  /**
   * Parse Tally amount format
   */
  parseTallyAmount(amount) {
    if (!amount || amount === '0' || amount === '') return 0;
    // Tally uses format like "Dr 1000" or "Cr 1000"
    const str = String(amount).trim();
    const match = str.match(/(?:Dr|Cr)\s*([\d.]+)/i);
    if (match) {
      const value = parseFloat(match[1]);
      return str.toLowerCase().includes('cr') ? -value : value;
    }
    return parseFloat(str) || 0;
  }

  /**
   * Parse Tally date format
   */
  parseTallyDate(dateStr) {
    if (!dateStr) return new Date();
    // Tally uses format like "20240101" or "01-04-2024"
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }
    // Try standard date parsing
    return new Date(dateStr);
  }

  /**
   * Parse Excel date
   */
  parseExcelDate(dateValue) {
    if (!dateValue) return new Date();
    // ExcelJS already converts Excel dates to Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }
    // If it's a number (Excel serial date), convert it
    if (typeof dateValue === 'number') {
      // Excel epoch starts from 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      return new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
    }
    return new Date(dateValue);
  }

  /**
   * Parse CSV date
   */
  parseCSVDate(dateStr) {
    if (!dateStr) return new Date();
    return new Date(dateStr);
  }

  /**
   * Parse Tally voucher entries
   */
  parseTallyVoucherEntries(entries) {
    if (!entries) return [];
    const entryList = Array.isArray(entries) ? entries : [entries];
    return entryList.map(entry => ({
      ledger: entry.LEDGERNAME || entry.$.LEDGERNAME,
      amount: this.parseTallyAmount(entry.AMOUNT || entry.$.AMOUNT || '0'),
      type: entry.AMOUNT && String(entry.AMOUNT).toLowerCase().includes('cr') ? 'credit' : 'debit',
    }));
  }

  /**
   * Calculate voucher total
   */
  calculateVoucherTotal(entries) {
    if (!entries) return 0;
    const entryList = Array.isArray(entries) ? entries : [entries];
    return entryList.reduce((sum, entry) => {
      return sum + Math.abs(this.parseTallyAmount(entry.AMOUNT || entry.$.AMOUNT || '0'));
    }, 0);
  }
}

module.exports = new TallyImportService();

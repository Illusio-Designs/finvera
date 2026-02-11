const puppeteer = require('puppeteer');
const handlebars = require('../utils/handlebarsHelpers');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class PDFService {
  constructor() {
    // Browser pool for performance
    this.browserPool = null;
    this.maxBrowsers = 3;
    this.currentBrowserIndex = 0;

    // Storage paths
    this.outputDir = path.join(__dirname, '../../generated-pdfs');
    this.templateDir = path.join(__dirname, '../../templates/pdf');

    // Initialize
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.templateDir, { recursive: true });

      // Initialize browser pool
      await this.initializeBrowserPool();

      logger.info('PDF Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PDF Service:', error);
      throw error;
    }
  }

  async initializeBrowserPool() {
    this.browserPool = [];
    for (let i = 0; i < this.maxBrowsers; i++) {
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });
        this.browserPool.push(browser);
        logger.info(`Browser ${i + 1}/${this.maxBrowsers} initialized`);
      } catch (error) {
        logger.error(`Failed to initialize browser ${i + 1}:`, error);
      }
    }

    if (this.browserPool.length === 0) {
      throw new Error('Failed to initialize any browsers');
    }
  }

  getBrowser() {
    // Round-robin browser selection
    const browser = this.browserPool[this.currentBrowserIndex];
    this.currentBrowserIndex = (this.currentBrowserIndex + 1) % this.browserPool.length;
    return browser;
  }

  async generatePDF(templateName, data, options = {}) {
    await this.initPromise;

    try {
      // Load and compile template
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      const html = template(data);

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const filename = options.filename || `${templateName}_${timestamp}_${random}.pdf`;
      const filepath = path.join(this.outputDir, filename);

      // Get browser from pool
      const browser = this.getBrowser();
      const page = await browser.newPage();

      try {
        // Set content and generate PDF
        await page.setContent(html, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        await page.pdf({
          path: filepath,
          format: options.format || 'A4',
          printBackground: true,
          margin: options.margin || {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm'
          },
          preferCSSPageSize: true
        });

        logger.info(`PDF generated successfully: ${filename}`);

        return {
          success: true,
          filename,
          filepath,
          url: `/api/downloads/${filename}`
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      logger.error('PDF Generation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generatePDFBuffer(templateName, data, options = {}) {
    await this.initPromise;

    try {
      // Load and compile template
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      const html = template(data);

      // Get browser from pool
      const browser = this.getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        const buffer = await page.pdf({
          format: options.format || 'A4',
          printBackground: true,
          margin: options.margin || {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm'
          },
          preferCSSPageSize: true
        });

        logger.info(`PDF buffer generated successfully for template: ${templateName}`);

        return {
          success: true,
          buffer
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      logger.error('PDF Buffer Generation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanupOldPDFs(daysOld = 7) {
    try {
      const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const files = await fs.readdir(this.outputDir);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtimeMs < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`Deleted old PDF: ${file}`);
        }
      }

      logger.info(`Cleanup completed: ${deletedCount} files deleted`);
      return { success: true, deletedCount };
    } catch (error) {
      logger.error('Cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePDF(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      await fs.unlink(filepath);
      logger.info(`PDF deleted: ${filename}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete PDF ${filename}:`, error);
      return { success: false, error: error.message };
    }
  }

  async shutdown() {
    logger.info('Shutting down PDF Service...');
    for (const browser of this.browserPool) {
      try {
        await browser.close();
      } catch (error) {
        logger.error('Error closing browser:', error);
      }
    }
    this.browserPool = [];
    logger.info('PDF Service shutdown complete');
  }
}

// Singleton instance
let pdfServiceInstance = null;

function getPDFService() {
  if (!pdfServiceInstance) {
    pdfServiceInstance = new PDFService();
  }
  return pdfServiceInstance;
}

module.exports = getPDFService();

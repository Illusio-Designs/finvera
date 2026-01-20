const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

function nowIso() {
  return new Date().toISOString();
}

function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

class IncomeTaxService {
  /**
   * Calculate Income Tax
   * Uses third-party API if configured, otherwise falls back to local calculation
   */
  async calculateTax(ctx, taxData) {
    const { company } = ctx;
    
    const {
      financialYear,
      incomeSources = {},
      deductions = {},
      exemptions = {},
      assesseeType = 'Individual',
      age = null,
      residentialStatus = 'Resident',
    } = taxData;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    let taxCalculation = null;
    let apiResponse = null;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        const requestData = {
          financial_year: financialYear,
          assessee_type: assesseeType,
          residential_status: residentialStatus,
          age: age,
          income_sources: incomeSources,
          deductions: deductions,
          exemptions: exemptions,
        };

        apiResponse = await apiClient.calculateIncomeTax(requestData);
        
        if (apiResponse) {
          taxCalculation = {
            totalIncome: apiResponse.totalIncome || apiResponse.total_income || 0,
            grossTotalIncome: apiResponse.grossTotalIncome || apiResponse.gross_total_income || 0,
            totalDeductions: apiResponse.totalDeductions || apiResponse.total_deductions || 0,
            taxableIncome: apiResponse.taxableIncome || apiResponse.taxable_income || 0,
            taxLiability: apiResponse.taxLiability || apiResponse.tax_liability || 0,
            rebate: apiResponse.rebate || 0,
            surcharge: apiResponse.surcharge || 0,
            cess: apiResponse.cess || 0,
            totalTax: apiResponse.totalTax || apiResponse.total_tax || 0,
            details: apiResponse,
          };
        }
      } catch (error) {
        logger.error('Third-party income tax calculation API error:', error);
        // Fall through to local calculation if API fails
      }
    }

    // Fallback to basic local calculation if API not available or failed
    if (!taxCalculation) {
      taxCalculation = this.calculateTaxLocally(taxData);
    }

    return {
      ...taxCalculation,
      apiResponse,
    };
  }

  /**
   * Basic local tax calculation (fallback)
   */
  calculateTaxLocally(taxData) {
    const { financialYear, incomeSources = {}, deductions = {}, age } = taxData;
    
    // Calculate total income
    let totalIncome = 0;
    Object.values(incomeSources).forEach(source => {
      totalIncome += parseFloat(source.amount || 0);
    });

    // Calculate total deductions
    let totalDeductions = 0;
    Object.values(deductions).forEach(deduction => {
      totalDeductions += parseFloat(deduction.amount || 0);
    });

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Basic tax slabs (FY 2023-24 for individuals)
    let tax = 0;
    if (taxableIncome > 250000) {
      if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
    }

    // Rebate under section 87A (for income up to 5 lakh)
    let rebate = 0;
    if (taxableIncome <= 500000 && age && age < 60) {
      rebate = Math.min(tax, 12500);
    }

    const taxAfterRebate = Math.max(0, tax - rebate);
    const cess = taxAfterRebate * 0.04; // 4% cess
    const totalTax = taxAfterRebate + cess;

    return {
      totalIncome,
      grossTotalIncome: totalIncome,
      totalDeductions,
      taxableIncome,
      taxLiability: tax,
      rebate,
      surcharge: 0,
      cess,
      totalTax,
      details: {
        note: 'Calculated locally (API not configured or failed)',
      },
    };
  }

  /**
   * Prepare ITR (Income Tax Return)
   * Uses third-party API if configured
   */
  async prepareITR(ctx, itrData) {
    const { company } = ctx;
    
    const {
      formType = 'ITR-1',
      financialYear,
      assesseeDetails,
      incomeDetails,
      deductionDetails,
      taxPaymentDetails,
    } = itrData;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    let preparedITR = null;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        const requestData = {
          financial_year: financialYear,
          assessee_details: assesseeDetails,
          income_details: incomeDetails,
          deduction_details: deductionDetails,
          tax_payment_details: taxPaymentDetails,
        };

        preparedITR = await apiClient.prepareITR(requestData, formType);
      } catch (error) {
        logger.error('Third-party ITR preparation API error:', error);
        throw new Error(`Failed to prepare ITR: ${error.message}`);
      }
    } else {
      // Local preparation (basic structure)
      preparedITR = {
        success: true,
        formType,
        financialYear,
        data: itrData,
        message: 'ITR prepared locally (API not configured)',
      };
    }

    return preparedITR;
  }

  /**
   * File ITR (Income Tax Return)
   * Uses third-party API if configured
   */
  async fileITR(ctx, itrData) {
    const { company } = ctx;
    
    const {
      formType = 'ITR-1',
      financialYear,
      preparedITRData,
    } = itrData;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    if (!useThirdParty) {
      throw new Error('Income Tax API not configured');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      
      const requestData = preparedITRData || itrData;
      
      const filedITR = await apiClient.fileITR(requestData, formType);
      
      return {
        success: true,
        returnId: filedITR.returnId || filedITR.return_id || null,
        acknowledgmentNumber: filedITR.acknowledgmentNumber || filedITR.acknowledgment_number || null,
        status: filedITR.status || 'filed',
        filedDate: filedITR.filedDate || filedITR.filed_date || new Date(),
        details: filedITR,
      };
    } catch (error) {
      logger.error('Third-party ITR filing API error:', error);
      throw new Error(`Failed to file ITR: ${error.message}`);
    }
  }

  /**
   * Get ITR status
   * Uses third-party API if configured
   */
  async getITRStatus(ctx, returnId, formType = 'ITR-1') {
    const { company } = ctx;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    if (!useThirdParty) {
      throw new Error('Income Tax API not configured');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const status = await apiClient.getITRStatus(returnId, formType);
      return status;
    } catch (error) {
      logger.error('Third-party ITR status API error:', error);
      throw new Error(`Failed to get ITR status: ${error.message}`);
    }
  }

  /**
   * Get Form 26AS (Tax Credit Statement)
   * Uses third-party API if configured
   */
  async getForm26AS(ctx, pan, financialYear) {
    const { company } = ctx;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    if (!useThirdParty) {
      throw new Error('Income Tax API not configured');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const form26AS = await apiClient.getForm26AS(pan, financialYear);
      return form26AS;
    } catch (error) {
      logger.error('Third-party Form 26AS API error:', error);
      throw new Error(`Failed to fetch Form 26AS: ${error.message}`);
    }
  }

  /**
   * Parse Form 16 (OCR)
   * Uses third-party API if configured
   */
  async parseForm16(ctx, form16Data) {
    const { company } = ctx;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && 
                          compliance.income_tax_api?.api_key;

    if (!useThirdParty) {
      throw new Error('Income Tax API not configured');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      
      // form16Data can be file buffer, base64, or file path
      const parsedData = await apiClient.parseForm16(form16Data);
      
      return {
        success: true,
        parsedData: parsedData.data || parsedData,
        employerDetails: parsedData.employerDetails || parsedData.employer_details,
        employeeDetails: parsedData.employeeDetails || parsedData.employee_details,
        salaryDetails: parsedData.salaryDetails || parsedData.salary_details,
        tdsDetails: parsedData.tdsDetails || parsedData.tds_details,
      };
    } catch (error) {
      logger.error('Third-party Form 16 parsing API error:', error);
      throw new Error(`Failed to parse Form 16: ${error.message}`);
    }
  }

  /**
   * Submit Tax P&L Job for Securities using Sandbox API
   */
  async submitTaxPnLJob(ctx, params) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && compliance.income_tax_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.submitTaxPnLJob(params);
        return {
          success: true,
          jobId: result.job_id || result.jobId,
          uploadUrl: result.upload_url || result.uploadUrl,
          message: result.message || 'Tax P&L job created successfully',
          details: result,
        };
      } catch (error) {
        logger.error('Third-party Tax P&L job API error:', error);
        throw new Error(`Failed to submit Tax P&L job: ${error.message}`);
      }
    }

    throw new Error('Income Tax API not configured');
  }

  /**
   * Get Tax P&L Job Status using Sandbox API
   */
  async getTaxPnLJobStatus(ctx, jobId) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && compliance.income_tax_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.getTaxPnLJobStatus(jobId);
        return {
          success: true,
          status: result.status,
          progress: result.progress,
          result: result.result,
          details: result,
        };
      } catch (error) {
        logger.error('Third-party Tax P&L job status API error:', error);
        throw new Error(`Failed to get Tax P&L job status: ${error.message}`);
      }
    }

    throw new Error('Income Tax API not configured');
  }

  /**
   * Upload Trading Data using Sandbox API
   */
  async uploadTradingData(ctx, uploadUrl, tradingData) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && compliance.income_tax_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.uploadTradingData(uploadUrl, tradingData);
        return {
          success: true,
          message: 'Trading data uploaded successfully',
          details: result,
        };
      } catch (error) {
        logger.error('Third-party trading data upload API error:', error);
        throw new Error(`Failed to upload trading data: ${error.message}`);
      }
    }

    throw new Error('Income Tax API not configured');
  }

  /**
   * Calculate Capital Gains Tax using Sandbox API
   */
  async calculateCapitalGainsTax(ctx, params) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.income_tax_api?.applicable && compliance.income_tax_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.calculateCapitalGainsTax(params);
        return {
          success: true,
          shortTermGains: result.short_term_gains || result.shortTermGains,
          longTermGains: result.long_term_gains || result.longTermGains,
          totalTax: result.total_tax || result.totalTax,
          details: result,
        };
      } catch (error) {
        logger.error('Third-party capital gains tax calculation API error:', error);
        throw new Error(`Failed to calculate capital gains tax: ${error.message}`);
      }
    }

    throw new Error('Income Tax API not configured');
  }
}

module.exports = new IncomeTaxService();

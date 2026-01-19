const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

function nowIso() {
  return new Date().toISOString();
}

function getQuarter(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  let quarter;

  if (month >= 4 && month <= 6) quarter = 'Q1';
  else if (month >= 7 && month <= 9) quarter = 'Q2';
  else if (month >= 10 && month <= 12) quarter = 'Q3';
  else quarter = 'Q4';

  return `${quarter}-${year}`;
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

class TDSService {
  /**
   * Calculate TDS for a voucher
   * Uses third-party API if configured, otherwise falls back to local calculation
   */
  async calculateTDS(ctx, voucherId, tdsSection, tdsRate) {
    const { tenantModels, company } = ctx;

    const voucher = await tenantModels.Voucher.findByPk(voucherId, {
      include: [{ model: tenantModels.Ledger, as: 'partyLedger' }],
    });

    if (!voucher) throw new Error('Voucher not found');

    const partyLedger = voucher.partyLedger;
    if (!partyLedger) throw new Error('Party ledger not found for voucher');

    const grossAmount = parseFloat(voucher.total_amount || 0);
    const section = tdsSection || partyLedger.tds_section || '194C';
    const rate = parseFloat(tdsRate) || parseFloat(partyLedger.tds_rate) || 10;

    // Determine quarter and financial year
    const paymentDate = voucher.voucher_date || new Date();
    const quarter = getQuarter(paymentDate);
    const financialYear = getFinancialYear(paymentDate);

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.tds_api?.applicable && 
                          compliance.tds_api?.api_key;

    let tdsAmount = (grossAmount * rate) / 100;
    let netAmount = grossAmount - tdsAmount;
    let apiResponse = null;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        // Prepare payment data for third-party API
        const paymentData = {
          section: section,
          grossAmount: grossAmount,
          rate: rate,
          paymentDate: paymentDate,
          deductee: {
            name: partyLedger.ledger_name || partyLedger.name || '',
            pan: partyLedger.pan || null,
            gstin: partyLedger.gstin || null,
          },
          deductor: {
            name: company.company_name || company.name || '',
            pan: company.pan || null,
            tan: company.tan || null,
          },
        };

        const result = await apiClient.calculateTDS(paymentData);
        apiResponse = result;
        
        // Use API response if available
        if (result.tdsAmount !== undefined) {
          tdsAmount = parseFloat(result.tdsAmount);
          netAmount = parseFloat(result.netAmount || (grossAmount - tdsAmount));
        }
      } catch (error) {
        logger.error('Third-party TDS calculation API error:', error);
        // Fall through to local calculation if API fails
      }
    }

    // Create or update TDS detail
    const existing = await tenantModels.TDSDetail.findOne({
      where: { voucher_id: voucherId }
    });

    const tdsData = {
      voucher_id: voucherId,
      ledger_id: voucher.party_ledger_id,
      section: section,
      tds_rate: rate,
      taxable_amount: grossAmount,
      tds_amount: parseFloat(tdsAmount.toFixed(2)),
      quarter: quarter,
      financial_year: financialYear,
    };

    let tdsDetail;
    if (existing) {
      await existing.update(tdsData);
      tdsDetail = existing;
    } else {
      tdsDetail = await tenantModels.TDSDetail.create(tdsData);
    }

    return {
      tdsDetail,
      summary: {
        grossAmount,
        tdsAmount: parseFloat(tdsAmount.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2)),
      },
      apiResponse,
    };
  }

  /**
   * Calculate TDS for a given amount (testing/preview mode)
   */
  async calculateTDSForAmount(ctx, amount, tdsSection = '194C', tdsRate = 10, panAvailable = true) {
    const { company } = ctx;

    const grossAmount = parseFloat(amount || 0);
    const section = tdsSection || '194C';
    const rate = parseFloat(tdsRate) || 10;

    // Adjust rate based on PAN availability (higher rate if PAN not available)
    const effectiveRate = panAvailable ? rate : rate * 2;

    // Determine quarter and financial year
    const paymentDate = new Date();
    const quarter = getQuarter(paymentDate);
    const financialYear = getFinancialYear(paymentDate);

    let tdsAmount = (grossAmount * effectiveRate) / 100;
    let netAmount = grossAmount - tdsAmount;

    // Return calculation without saving to database
    return {
      tdsDetail: {
        section: section,
        tds_rate: effectiveRate,
        taxable_amount: grossAmount,
        tds_amount: parseFloat(tdsAmount.toFixed(2)),
        quarter: quarter,
        financial_year: financialYear,
        pan_available: panAvailable,
      },
      summary: {
        grossAmount,
        tdsAmount: parseFloat(tdsAmount.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2)),
        effectiveRate,
      },
      apiResponse: null,
    };
  }

  /**
   * Prepare and file TDS return
   * Uses third-party API if configured
   */
  async prepareAndFileReturn(ctx, quarter, financialYear) {
    const { tenantModels, company } = ctx;

    const where = {
      quarter,
      financial_year: financialYear,
    };

    const tdsDetails = await tenantModels.TDSDetail.findAll({
      where,
    });

    if (!tdsDetails || tdsDetails.length === 0) {
      throw new Error('No TDS details found for the specified quarter and financial year');
    }

    // Group by TDS section
    const returnData = {
      tan: company?.tan || '',
      financial_year: financialYear,
      quarter: quarter,
      formType: '24Q', // Default form type
      deducteeDetails: [],
    };

    // Fetch related ledgers and vouchers
    const ledgerIds = [...new Set(tdsDetails.map(tds => tds.ledger_id))];
    const voucherIds = [...new Set(tdsDetails.map(tds => tds.voucher_id))];
    
    const ledgers = await tenantModels.Ledger.findAll({
      where: { id: ledgerIds },
    });
    const vouchers = await tenantModels.Voucher.findAll({
      where: { id: voucherIds },
    });
    
    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));
    const voucherMap = new Map(vouchers.map(v => [v.id, v]));

    // Prepare deductee details for API
    tdsDetails.forEach((tds) => {
      const deductee = ledgerMap.get(tds.ledger_id) || {};
      const voucher = voucherMap.get(tds.voucher_id) || {};
      returnData.deducteeDetails.push({
        pan: deductee.pan || '',
        name: deductee.ledger_name || deductee.name || '',
        section: tds.section,
        rate: parseFloat(tds.tds_rate),
        grossAmount: parseFloat(tds.taxable_amount),
        tdsAmount: parseFloat(tds.tds_amount),
        paymentDate: voucher.voucher_date || new Date(),
        voucherNumber: voucher.voucher_number || '',
      });
    });

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.tds_api?.applicable && 
                          compliance.tds_api?.api_key;

    let preparedReturn = null;
    let filedReturn = null;
    let returnId = null;
    let acknowledgmentNumber = null;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        // Prepare return using Sandbox API
        preparedReturn = await apiClient.prepareTDSReturn(returnData, '24Q');
        
        if (preparedReturn && preparedReturn.success !== false) {
          // File the return
          filedReturn = await apiClient.fileTDSReturn(returnData, '24Q');
          
          if (filedReturn) {
            returnId = filedReturn.returnId || filedReturn.return_id || null;
            acknowledgmentNumber = filedReturn.acknowledgmentNumber || filedReturn.acknowledgment_number || null;
          }
        }
      } catch (error) {
        logger.error('Third-party TDS return API error:', error);
        throw new Error(`Failed to prepare/file TDS return: ${error.message}`);
      }
    } else {
      // Local preparation without API
      preparedReturn = {
        success: true,
        returnData: returnData,
        message: 'TDS return prepared locally (API not configured)',
      };
    }

    return {
      preparedReturn,
      filedReturn,
      returnId,
      acknowledgmentNumber,
      summary: {
        totalDeductees: tdsDetails.length,
        totalTDS: tdsDetails.reduce((sum, tds) => sum + parseFloat(tds.tds_amount), 0),
        totalSections: new Set(tdsDetails.map(tds => tds.section)).size,
      },
    };
  }

  /**
   * Generate Form 16A certificate
   * Uses third-party API if configured, otherwise generates locally
   */
  async generateForm16A(ctx, tdsDetailId) {
    const { tenantModels, company } = ctx;

    const tdsDetail = await tenantModels.TDSDetail.findByPk(tdsDetailId);

    if (!tdsDetail) {
      throw new Error('TDS detail not found');
    }

    const ledger = await tenantModels.Ledger.findByPk(tdsDetail.ledger_id);
    const voucher = await tenantModels.Voucher.findByPk(tdsDetail.voucher_id);

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.tds_api?.applicable && 
                          compliance.tds_api?.api_key;

    let certificate = null;
    let certificateNumber = null;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        // Generate Form 16A using Sandbox API
        const apiResponse = await apiClient.generateForm16A(tdsDetailId);
        
        if (apiResponse && apiResponse.certificate) {
          certificate = apiResponse.certificate;
          certificateNumber = apiResponse.certificateNumber || apiResponse.certificate_number || null;
        }
      } catch (error) {
        logger.error('Third-party Form 16A API error:', error);
        // Fall through to local generation if API fails
      }
    }

    // If API didn't return certificate, generate locally
    if (!certificate) {
      // Generate certificate number
      // Note: certificate_number field may not exist in the model, so we generate it in-memory
      certificateNumber = tdsDetail.certificate_number || `TDS/${tdsDetail.financial_year}/${tdsDetail.quarter}/${tdsDetail.id.substring(0, 8).toUpperCase()}`;
      
      // Try to save certificate_number if the field exists (optional, won't fail if it doesn't)
      if (!tdsDetail.certificate_number) {
        try {
          await tdsDetail.update({ certificate_number: certificateNumber }).catch(() => {
            // Ignore if field doesn't exist
          });
        } catch (e) {
          // Ignore update errors
        }
      }

      // Form 16A structure
      certificate = {
        certificate_type: 'Form 16A',
        certificate_number: certificateNumber,
        financial_year: tdsDetail.financial_year,
        quarter: tdsDetail.quarter,
        deductor: {
          name: company?.company_name || company?.name || '',
          pan: company?.pan || '',
          tan: company?.tan || '',
          address: company?.registered_address || company?.address || '',
        },
        deductee: {
          name: ledger?.ledger_name || ledger?.name || '',
          pan: ledger?.pan || '',
          address: `${ledger?.address || ''}, ${ledger?.city || ''}, ${ledger?.state || ''} - ${ledger?.pincode || ''}`,
        },
        tds_details: {
          section: tdsDetail.section,
          rate: tdsDetail.tds_rate,
          gross_amount: tdsDetail.taxable_amount,
          tds_amount: tdsDetail.tds_amount,
          voucher_number: voucher?.voucher_number || '',
          voucher_date: voucher?.voucher_date || null,
        },
        issued_date: new Date().toISOString(),
      };
    }

    return {
      certificate,
      tdsDetail,
      ledger,
      voucher,
    };
  }

  /**
   * Get TDS return status
   * Uses third-party API if configured
   */
  async getReturnStatus(ctx, returnId, formType = '24Q') {
    const { company } = ctx;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.tds_api?.applicable && 
                          compliance.tds_api?.api_key;

    if (!useThirdParty) {
      throw new Error('TDS API not configured');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const status = await apiClient.getTDSReturnStatus(returnId, formType);
      return status;
    } catch (error) {
      logger.error('Third-party TDS return status API error:', error);
      throw new Error(`Failed to get TDS return status: ${error.message}`);
    }
  }
}

module.exports = new TDSService();

const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

/**
 * FinBox Service
 * Handles credit scoring, loan eligibility, and financial data analysis
 * Uses FinBox API for credit assessment and lending services
 */
class FinBoxService {
  /**
   * Check if FinBox API is configured
   */
  isConfigured(company) {
    const compliance = company?.compliance || {};
    return compliance.finbox_api?.applicable && compliance.finbox_api?.api_key;
  }

  /**
   * Get credit score for a customer
   * Uses FinBox API to fetch credit score from bureau (CIBIL/Experian)
   */
  async getCreditScore(ctx, customerId, pan) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured. Please configure FinBox API in company settings.');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!pan) {
      throw new Error('PAN is required for credit score check');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const creditScore = await apiClient.getCreditScore(customerId, pan, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        creditScore: creditScore.score || creditScore.credit_score,
        bureau: creditScore.bureau || creditScore.source || 'CIBIL',
        reportDate: creditScore.report_date || creditScore.date,
        details: creditScore,
      };
    } catch (error) {
      logger.error('FinBox credit score API error:', error);
      throw new Error(`Failed to fetch credit score: ${error.message}`);
    }
  }

  /**
   * Get FinBox Inclusion Score (FIS)
   * Alternative credit score for new-to-credit customers
   */
  async getInclusionScore(ctx, customerId) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const fisData = await apiClient.getFinBoxInclusionScore(customerId, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        inclusionScore: fisData.score || fisData.fis_score,
        riskCategory: fisData.risk_category || fisData.category,
        details: fisData,
      };
    } catch (error) {
      logger.error('FinBox Inclusion Score API error:', error);
      throw new Error(`Failed to fetch inclusion score: ${error.message}`);
    }
  }

  /**
   * Check loan eligibility
   * Determines if customer is eligible for a loan and eligible amount
   */
  async checkLoanEligibility(ctx, customerId, loanData = {}) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const eligibility = await apiClient.getLoanEligibility(customerId, loanData, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        eligible: eligibility.eligible || eligibility.is_eligible || false,
        eligibleAmount: eligibility.eligible_amount || eligibility.amount || 0,
        interestRate: eligibility.interest_rate || eligibility.rate,
        tenure: eligibility.tenure || eligibility.tenure_months,
        details: eligibility,
      };
    } catch (error) {
      logger.error('FinBox loan eligibility API error:', error);
      throw new Error(`Failed to check loan eligibility: ${error.message}`);
    }
  }

  /**
   * Create FinBox user
   * Register a customer in FinBox system
   */
  async createUser(ctx, customerId, userData) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const user = await apiClient.createFinBoxUser(customerId, userData, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        finboxUserId: user.user_id || user.id,
        user: user,
      };
    } catch (error) {
      logger.error('FinBox create user API error:', error);
      throw new Error(`Failed to create FinBox user: ${error.message}`);
    }
  }

  /**
   * Initiate bank statement collection
   * Start the process of collecting bank statements via BankConnect
   */
  async initiateBankStatement(ctx, customerId, bankData) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const result = await apiClient.initiateBankConnect(customerId, bankData, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        sessionId: result.session_id || result.id,
        redirectUrl: result.redirect_url || result.url,
        status: result.status || 'initiated',
        details: result,
      };
    } catch (error) {
      logger.error('FinBox bank connect API error:', error);
      throw new Error(`Failed to initiate bank statement collection: ${error.message}`);
    }
  }

  /**
   * Get bank statement status
   * Check the status of bank statement collection
   */
  async getBankStatementStatus(ctx, customerId) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const status = await apiClient.getBankConnectStatus(customerId, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        status: status.status || status.state,
        completed: status.completed || status.is_completed || false,
        details: status,
      };
    } catch (error) {
      logger.error('FinBox bank connect status API error:', error);
      throw new Error(`Failed to get bank statement status: ${error.message}`);
    }
  }

  /**
   * Get bank statement analysis
   * Get analyzed data from bank statements
   */
  async getBankStatementAnalysis(ctx, customerId) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const analysis = await apiClient.getBankStatementAnalysis(customerId, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        analysis: analysis.analysis || analysis.data,
        cashFlow: analysis.cash_flow || analysis.cashflow,
        income: analysis.income || analysis.monthly_income,
        expenses: analysis.expenses || analysis.monthly_expenses,
        averageBalance: analysis.average_balance || analysis.avg_balance,
        details: analysis,
      };
    } catch (error) {
      logger.error('FinBox bank statement analysis API error:', error);
      throw new Error(`Failed to get bank statement analysis: ${error.message}`);
    }
  }

  /**
   * Get device insights
   * Get device intelligence data for credit assessment
   */
  async getDeviceInsights(ctx, customerId, version, salt) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!version) {
      throw new Error('Version is required for device insights');
    }

    if (!salt) {
      throw new Error('Salt is required for device insights');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const insights = await apiClient.getDeviceInsights(customerId, version, salt, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        insights: insights.insights || insights.predictors || insights.data,
        riskScore: insights.risk_score || insights.score,
        details: insights,
      };
    } catch (error) {
      logger.error('FinBox device insights API error:', error);
      throw new Error(`Failed to get device insights: ${error.message}`);
    }
  }

  /**
   * Generate session token for SDK
   * Generate a token for embedded lending flow
   */
  async generateSessionToken(ctx, customerId, sessionData = {}) {
    const { company } = ctx;

    if (!this.isConfigured(company)) {
      throw new Error('FinBox API not configured');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const session = await apiClient.generateSessionToken(customerId, sessionData, 'finbox');
      
      return {
        success: true,
        customerId: customerId,
        sessionToken: session.token || session.session_token,
        sessionUrl: session.url || session.session_url,
        expiresAt: session.expires_at || session.expiry,
        details: session,
      };
    } catch (error) {
      logger.error('FinBox session token API error:', error);
      throw new Error(`Failed to generate session token: ${error.message}`);
    }
  }
}

module.exports = new FinBoxService();

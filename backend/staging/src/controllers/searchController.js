const { Op } = require('sequelize');
const logger = require('../utils/logger');
const masterModels = require('../models/masterModels');

/**
 * Universal Search Controller
 * Searches across multiple entities based on context (admin/client)
 */
module.exports = {
  async universalSearch(req, res, next) {
    try {
      const { q, type, limit = 10 } = req.query;
      const query = String(q || '').trim();

      if (!query || query.length < 2) {
        return res.json({ 
          success: true, 
          results: [],
          message: 'Query must be at least 2 characters'
        });
      }

      const searchLimit = Math.min(parseInt(limit) || 10, 50);
      const results = {
        ledgers: [],
        vouchers: [],
        inventory: [],
        warehouses: [],
        companies: [],
        users: [],
        tenants: [],
        distributors: [],
        salesmen: [],
        support_tickets: [],
      };

      const searchPattern = `%${query}%`;

      // Determine context - check if tenant models are available (client context)
      // For admin users, tenantModels might not be set, so we check user role too
      const isClientContext = req.tenantModels && req.tenant_id && req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.role !== 'finance_manager';
      const isAdminContext = !isClientContext || (req.user && ['admin', 'super_admin', 'finance_manager', 'distributor', 'salesman'].includes(req.user.role));

      try {
        // Client context searches
        if (isClientContext) {
          // Search Ledgers
          if (!type || type === 'ledgers') {
            try {
              const ledgers = await req.tenantModels.Ledger.findAll({
                where: {
                  [Op.or]: [
                    { ledger_name: { [Op.like]: searchPattern } },
                    { ledger_code: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['ledger_name', 'ASC']],
                attributes: ['id', 'ledger_name', 'ledger_code', 'account_group_id'],
              });
              results.ledgers = ledgers.map(l => ({
                id: l.id,
                name: l.ledger_name,
                code: l.ledger_code,
                type: 'ledger',
                url: `/client/ledgers?id=${l.id}`,
              }));
            } catch (err) {
              logger.error('Error searching ledgers:', err);
            }
          }

          // Search Vouchers
          if (!type || type === 'vouchers') {
            try {
              const vouchers = await req.tenantModels.Voucher.findAll({
                where: {
                  [Op.or]: [
                    { voucher_number: { [Op.like]: searchPattern } },
                    { narration: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['voucher_date', 'DESC']],
                attributes: ['id', 'voucher_number', 'voucher_type', 'voucher_date', 'narration'],
              });
              results.vouchers = vouchers.map(v => ({
                id: v.id,
                name: v.voucher_number,
                type: 'voucher',
                subtype: v.voucher_type,
                date: v.voucher_date,
                url: `/client/vouchers/${v.id}`,
              }));
            } catch (err) {
              logger.error('Error searching vouchers:', err);
            }
          }

          // Search Inventory Items
          if (!type || type === 'inventory') {
            try {
              const inventory = await req.tenantModels.InventoryItem.findAll({
                where: {
                  [Op.or]: [
                    { item_name: { [Op.like]: searchPattern } },
                    { item_code: { [Op.like]: searchPattern } },
                    { hsn_sac_code: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['item_name', 'ASC']],
                attributes: ['id', 'item_name', 'item_code', 'hsn_sac_code'],
              });
              results.inventory = inventory.map(i => ({
                id: i.id,
                name: i.item_name,
                code: i.item_code,
                hsn: i.hsn_sac_code,
                type: 'inventory',
                url: `/client/inventory?id=${i.id}`,
              }));
            } catch (err) {
              logger.error('Error searching inventory:', err);
            }
          }

          // Search Warehouses
          if (!type || type === 'warehouses') {
            try {
              const warehouses = await req.tenantModels.Warehouse.findAll({
                where: {
                  [Op.or]: [
                    { warehouse_name: { [Op.like]: searchPattern } },
                    { warehouse_code: { [Op.like]: searchPattern } },
                    { city: { [Op.like]: searchPattern } },
                    { state: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['warehouse_name', 'ASC']],
                attributes: ['id', 'warehouse_name', 'warehouse_code', 'city', 'state'],
              });
              results.warehouses = warehouses.map(w => ({
                id: w.id,
                name: w.warehouse_name,
                code: w.warehouse_code,
                location: `${w.city || ''}, ${w.state || ''}`.trim(),
                type: 'warehouse',
                url: `/client/warehouses?id=${w.id}`,
              }));
            } catch (err) {
              logger.error('Error searching warehouses:', err);
            }
          }

          // Search Companies (for client users)
          if (!type || type === 'companies') {
            try {
              if (masterModels && masterModels.Company && req.tenant_id) {
                const companies = await masterModels.Company.findAll({
                  where: {
                    tenant_id: req.tenant_id,
                    is_active: true,
                    [Op.or]: [
                      { company_name: { [Op.like]: searchPattern } },
                      { gstin: { [Op.like]: searchPattern } },
                    ],
                  },
                  limit: searchLimit,
                  order: [['company_name', 'ASC']],
                  attributes: ['id', 'company_name', 'gstin'],
                });
                results.companies = companies.map(c => ({
                  id: c.id,
                  name: c.company_name,
                  gstin: c.gstin,
                  type: 'company',
                  url: `/client/companies?id=${c.id}`,
                }));
              }
            } catch (err) {
              logger.error('Error searching companies:', err);
            }
          }
        }

        // Admin context searches
        if (isAdminContext) {
          // Search Tenants
          if (!type || type === 'tenants') {
            try {
              const TenantMaster = require('../models/TenantMaster');
              const tenants = await TenantMaster.findAll({
                where: {
                  [Op.or]: [
                    { company_name: { [Op.like]: searchPattern } },
                    { subdomain: { [Op.like]: searchPattern } },
                    { email: { [Op.like]: searchPattern } },
                    { gstin: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['company_name', 'ASC']],
                attributes: ['id', 'company_name', 'subdomain', 'email', 'gstin'],
              });
              results.tenants = tenants.map(t => ({
                id: t.id,
                name: t.company_name,
                subdomain: t.subdomain,
                email: t.email,
                type: 'tenant',
                url: `/admin/tenants?id=${t.id}`,
              }));
            } catch (err) {
              logger.error('Error searching tenants:', err);
            }
          }

          // Search Distributors
          if (!type || type === 'distributors') {
            try {
              const Distributor = require('../models/Distributor');
              const distributors = await Distributor.findAll({
                where: {
                  [Op.or]: [
                    { company_name: { [Op.like]: searchPattern } },
                    { distributor_code: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['company_name', 'ASC']],
                attributes: ['id', 'company_name', 'distributor_code'],
              });
              results.distributors = distributors.map(d => ({
                id: d.id,
                name: d.company_name,
                code: d.distributor_code,
                type: 'distributor',
                url: `/admin/distributors?id=${d.id}`,
              }));
            } catch (err) {
              logger.error('Error searching distributors:', err);
            }
          }

          // Search Salesmen
          if (!type || type === 'salesmen') {
            try {
              const Salesman = require('../models/Salesman');
              const salesmen = await Salesman.findAll({
                where: {
                  [Op.or]: [
                    { full_name: { [Op.like]: searchPattern } },
                    { salesman_code: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['full_name', 'ASC']],
                attributes: ['id', 'full_name', 'salesman_code'],
              });
              results.salesmen = salesmen.map(s => ({
                id: s.id,
                name: s.full_name,
                code: s.salesman_code,
                type: 'salesman',
                url: `/admin/salesmen?id=${s.id}`,
              }));
            } catch (err) {
              logger.error('Error searching salesmen:', err);
            }
          }

          // Search Users
          if (!type || type === 'users') {
            try {
              const User = require('../models/User');
              const users = await User.findAll({
                where: {
                  [Op.or]: [
                    { name: { [Op.like]: searchPattern } },
                    { email: { [Op.like]: searchPattern } },
                  ],
                },
                limit: searchLimit,
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'email', 'role'],
              });
              results.users = users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                type: 'user',
                url: `/admin/users?id=${u.id}`,
              }));
            } catch (err) {
              logger.error('Error searching users:', err);
            }
          }
        }

        // Search Support Tickets (both contexts)
        if (!type || type === 'support_tickets') {
          try {
            const SupportTicket = require('../models/SupportTicket');
            const tickets = await SupportTicket.findAll({
              where: {
                [Op.or]: [
                  { ticket_number: { [Op.like]: searchPattern } },
                  { subject: { [Op.like]: searchPattern } },
                  { description: { [Op.like]: searchPattern } },
                ],
              },
              limit: searchLimit,
              order: [['createdAt', 'DESC']],
              attributes: ['id', 'ticket_number', 'subject', 'status', 'priority'],
            });
            results.support_tickets = tickets.map(t => ({
              id: t.id,
              name: t.ticket_number,
              subject: t.subject,
              status: t.status,
              priority: t.priority,
              type: 'support_ticket',
              url: isClientContext ? `/client/support?ticket=${t.id}` : `/admin/support?ticket=${t.id}`,
            }));
          } catch (err) {
            logger.error('Error searching support tickets:', err);
          }
        }

        // Flatten results into a single array with counts
        const allResults = [];
        Object.keys(results).forEach(key => {
          if (results[key].length > 0) {
            allResults.push(...results[key]);
          }
        });

        const summary = Object.keys(results).reduce((acc, key) => {
          acc[key] = results[key].length;
          return acc;
        }, {});

        res.json({
          success: true,
          query,
          results: allResults,
          summary,
          total: allResults.length,
        });

      } catch (error) {
        logger.error('Universal search error:', error);
        throw error;
      }

    } catch (err) {
      next(err);
    }
  },
};

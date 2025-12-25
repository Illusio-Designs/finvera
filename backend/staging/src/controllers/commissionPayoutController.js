const { Commission, Distributor, Salesman, Payout } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get commission-payout summary grouped by user and role
   * Returns total commission for each user (distributor/salesman) with payout status
   */
  async summary(req, res, next) {
    try {
      const { page = 1, limit = 20, status, role } = req.query;
      const offset = (page - 1) * limit;

      // Get all commissions with related distributor/salesman info
      const where = {};
      if (status) {
        // If filtering by payout status, we'll need to join with payouts
        // For now, we'll filter after aggregation
      }

      const commissions = await Commission.findAll({
        where,
        include: [
          {
            model: Distributor,
            attributes: ['id', 'distributor_code', 'company_name', 'user_id'],
            required: false,
          },
          {
            model: Salesman,
            attributes: ['id', 'salesman_code', 'full_name', 'user_id'],
            required: false,
          },
          {
            model: Payout,
            attributes: ['id', 'status', 'notes'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Group commissions by user (distributor_id or salesman_id) and role
      const groupedData = {};

      commissions.forEach((commission) => {
        let userId = null;
        let userCode = null;
        let userName = null;
        let userRole = null;
        let payoutId = null;
        let payoutStatus = 'pending';
        let payoutRemark = null;

        if (commission.distributor_id && commission.Distributor) {
          userId = commission.distributor_id;
          userCode = commission.Distributor.distributor_code;
          userName = commission.Distributor.company_name || commission.Distributor.distributor_code;
          userRole = 'distributor';
        } else if (commission.salesman_id && commission.Salesman) {
          userId = commission.salesman_id;
          userCode = commission.Salesman.salesman_code;
          userName = commission.Salesman.full_name || commission.Salesman.salesman_code;
          userRole = 'salesman';
        }

        if (!userId) return; // Skip if no user found

        // Get payout status
        if (commission.payout_id && commission.Payout) {
          payoutId = commission.payout_id;
          payoutStatus = commission.Payout.status || 'pending';
          payoutRemark = commission.Payout.notes || null;
        } else {
          // Check if there's a payout for this user
          // We'll handle this in a separate query for efficiency
        }

        const key = `${userRole}_${userId}`;

        if (!groupedData[key]) {
          groupedData[key] = {
            user_id: userId,
            user_code: userCode,
            user_name: userName,
            role: userRole,
            total_commission: 0,
            commission_count: 0,
            payout_id: payoutId,
            payout_status: payoutStatus,
            payout_remark: payoutRemark,
            commissions: [],
          };
        }

        groupedData[key].total_commission += parseFloat(commission.amount || 0);
        groupedData[key].commission_count += 1;
        groupedData[key].commissions.push({
          id: commission.id,
          amount: commission.amount,
          commission_type: commission.commission_type,
          commission_date: commission.commission_date,
        });

        // Update payout info if this commission has a payout
        if (payoutId && (!groupedData[key].payout_id || groupedData[key].payout_id !== payoutId)) {
          groupedData[key].payout_id = payoutId;
          groupedData[key].payout_status = payoutStatus;
          groupedData[key].payout_remark = payoutRemark;
        }
      });

      // Convert to array and get latest payout status for each user
      let summaryArray = Object.values(groupedData);

      // Get latest payout status for users without payout in commissions
      for (const item of summaryArray) {
        if (!item.payout_id || item.payout_status === 'pending') {
          const payoutWhere = {};
          if (item.role === 'distributor') {
            payoutWhere.distributor_id = item.user_id;
          } else if (item.role === 'salesman') {
            payoutWhere.salesman_id = item.user_id;
          }

          const latestPayout = await Payout.findOne({
            where: payoutWhere,
            order: [['createdAt', 'DESC']],
          });

          if (latestPayout) {
            item.payout_id = latestPayout.id;
            item.payout_status = latestPayout.status || 'pending';
            item.payout_remark = latestPayout.notes || null;
          }
        }
      }

      // Apply filters
      if (status) {
        summaryArray = summaryArray.filter((item) => item.payout_status === status);
      }
      if (role) {
        summaryArray = summaryArray.filter((item) => item.role === role);
      }

      // Sort by total commission descending
      summaryArray.sort((a, b) => b.total_commission - a.total_commission);

      // Pagination
      const total = summaryArray.length;
      const paginatedData = summaryArray.slice(offset, offset + parseInt(limit));

      res.json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        data: paginatedData,
      });
    } catch (err) {
      logger.error('Commission-payout summary error:', err);
      next(err);
    }
  },

  /**
   * Update payout status for a user
   */
  async updatePayoutStatus(req, res, next) {
    try {
      const { user_id, role } = req.params;
      const { status, remark } = req.body;

      if (!['pending', 'paid', 'reject'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be pending, paid, or reject' });
      }

      // Find or create payout for this user
      const payoutWhere = {};
      if (role === 'distributor') {
        payoutWhere.distributor_id = user_id;
      } else if (role === 'salesman') {
        payoutWhere.salesman_id = user_id;
      }

      let payout = await Payout.findOne({
        where: payoutWhere,
        order: [['createdAt', 'DESC']],
      });

      // Calculate total commission for this user
      const commissionWhere = {};
      if (role === 'distributor') {
        commissionWhere.distributor_id = user_id;
      } else if (role === 'salesman') {
        commissionWhere.salesman_id = user_id;
      }

      const totalCommission = await Commission.sum('amount', {
        where: commissionWhere,
      });

      if (!payout) {
        // Create new payout
        payout = await Payout.create({
          distributor_id: role === 'distributor' ? user_id : null,
          salesman_id: role === 'salesman' ? user_id : null,
          payout_type: role,
          total_amount: totalCommission || 0,
          status: status,
          notes: status === 'reject' ? remark : null,
        });
      } else {
        // Update existing payout
        await payout.update({
          status: status,
          notes: status === 'reject' ? remark : payout.notes,
          total_amount: totalCommission || payout.total_amount,
        });
      }

      // Update related commissions
      if (status === 'paid') {
        await Commission.update(
          { status: 'paid', payout_id: payout.id },
          {
            where: {
              ...commissionWhere,
              status: { [Op.ne]: 'cancelled' },
            },
          }
        );
      } else if (status === 'reject') {
        // When rejected, we might want to keep commissions as pending
        // or mark them differently based on business logic
        await Commission.update(
          { payout_id: payout.id },
          {
            where: commissionWhere,
          }
        );
      }

      res.json({
        message: 'Payout status updated successfully',
        payout,
      });
    } catch (err) {
      logger.error('Update payout status error:', err);
      next(err);
    }
  },
};

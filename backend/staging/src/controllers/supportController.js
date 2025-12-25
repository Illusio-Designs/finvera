const { SupportTicket, TicketMessage, SupportAgentReview, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  // Client creates ticket (public or authenticated)
  async createTicket(req, res, next) {
    try {
      const {
        client_name,
        client_email,
        client_phone,
        subject,
        description,
        category,
        priority,
        attachments,
      } = req.body;

      const ticket = await SupportTicket.create({
        tenant_id: req.user?.tenant_id || null, // If authenticated tenant user
        client_name,
        client_email,
        client_phone,
        subject,
        description,
        category,
        priority: priority || 'medium',
        attachments: attachments || [],
        status: 'open',
      });

      // Create initial message
      await TicketMessage.create({
        ticket_id: ticket.id,
        sender_type: 'client',
        sender_name: client_name,
        message: description,
        attachments: attachments || [],
      });

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket created successfully. We will get back to you soon!',
      });
    } catch (error) {
      logger.error('Create ticket error:', error);
      next(error);
    }
  },

  // List all tickets (admin/support agent)
  async listTickets(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        assigned_to,
        search,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
      if (assigned_to) where.assigned_to = assigned_to;

      if (search) {
        where[Op.or] = [
          { ticket_number: { [Op.like]: `%${search}%` } },
          { subject: { [Op.like]: `%${search}%` } },
          { client_email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await SupportTicket.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('List tickets error:', error);
      next(error);
    }
  },

  // Get single ticket with messages
  async getTicket(req, res, next) {
    try {
      const { id } = req.params;

      const ticket = await SupportTicket.findByPk(id, {
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['id', 'name', 'email', 'role'],
          },
          {
            model: TicketMessage,
            as: 'messages',
            order: [['createdAt', 'ASC']],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: SupportAgentReview,
            as: 'review',
          },
        ],
      });

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Get ticket error:', error);
      next(error);
    }
  },

  // Assign ticket to support agent
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { agent_id } = req.body;

      const ticket = await SupportTicket.findByPk(id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      // Verify agent exists and has support_agent role
      const agent = await User.findByPk(agent_id);
      if (!agent || agent.role !== 'support_agent') {
        return res.status(400).json({ success: false, error: 'Invalid support agent' });
      }

      await ticket.update({
        assigned_to: agent_id,
        status: 'assigned',
      });

      // Create system message
      await TicketMessage.create({
        ticket_id: ticket.id,
        sender_type: 'system',
        sender_name: 'System',
        message: `Ticket assigned to ${agent.name}`,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Assign ticket error:', error);
      next(error);
    }
  },

  // Update ticket status
  async updateTicketStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, resolution_note } = req.body;

      const ticket = await SupportTicket.findByPk(id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      const updateData = { status };

      if (status === 'resolved') {
        updateData.resolved_at = new Date();
        if (resolution_note) {
          updateData.resolution_note = resolution_note;
        }
      }

      if (status === 'closed') {
        updateData.closed_at = new Date();
      }

      await ticket.update(updateData);

      // Create system message
      await TicketMessage.create({
        ticket_id: ticket.id,
        sender_type: 'system',
        sender_name: 'System',
        message: `Ticket status changed to: ${status}`,
      });

      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Update ticket status error:', error);
      next(error);
    }
  },

  // Add message to ticket
  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { message, attachments, is_internal } = req.body;

      const ticket = await SupportTicket.findByPk(id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      const ticketMessage = await TicketMessage.create({
        ticket_id: id,
        sender_type: req.user ? 'agent' : 'client',
        sender_id: req.user?.id || null,
        sender_name: req.user?.name || ticket.client_name,
        message,
        attachments: attachments || [],
        is_internal: is_internal || false,
      });

      // Update ticket status if needed
      if (ticket.status === 'waiting_client' && !req.user) {
        await ticket.update({ status: 'in_progress' });
      }

      res.status(201).json({ success: true, data: ticketMessage });
    } catch (error) {
      logger.error('Add message error:', error);
      next(error);
    }
  },

  // Client submits review after ticket resolution
  async submitReview(req, res, next) {
    try {
      const { ticket_id } = req.params;
      const {
        rating,
        comment,
        resolution_speed,
        communication,
        knowledge,
        friendliness,
        would_recommend,
      } = req.body;

      const ticket = await SupportTicket.findByPk(ticket_id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      // Only allow review for resolved/closed tickets
      if (!['resolved', 'closed'].includes(ticket.status)) {
        return res.status(400).json({
          success: false,
          error: 'Can only review resolved or closed tickets',
        });
      }

      // Check if review already exists
      const existingReview = await SupportAgentReview.findOne({
        where: { ticket_id },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'Review already submitted for this ticket',
        });
      }

      const review = await SupportAgentReview.create({
        ticket_id,
        agent_id: ticket.assigned_to,
        tenant_id: ticket.tenant_id,
        client_name: ticket.client_name,
        client_email: ticket.client_email,
        rating,
        comment,
        resolution_speed,
        communication,
        knowledge,
        friendliness,
        would_recommend,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      logger.error('Submit review error:', error);
      next(error);
    }
  },

  // Get agent performance/reviews
  async getAgentReviews(req, res, next) {
    try {
      const { agent_id } = req.params;

      const reviews = await SupportAgentReview.findAll({
        where: { agent_id },
        include: [
          {
            model: SupportTicket,
            as: 'ticket',
            attributes: ['ticket_number', 'subject', 'resolved_at'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Calculate stats
      const stats = {
        total_reviews: reviews.length,
        average_rating: 0,
        average_communication: 0,
        average_knowledge: 0,
        average_friendliness: 0,
        recommend_percentage: 0,
      };

      if (reviews.length > 0) {
        stats.average_rating = (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(2);

        const commCount = reviews.filter((r) => r.communication).length;
        if (commCount > 0) {
          stats.average_communication = (
            reviews.reduce((sum, r) => sum + (r.communication || 0), 0) / commCount
          ).toFixed(2);
        }

        const knowCount = reviews.filter((r) => r.knowledge).length;
        if (knowCount > 0) {
          stats.average_knowledge = (
            reviews.reduce((sum, r) => sum + (r.knowledge || 0), 0) / knowCount
          ).toFixed(2);
        }

        const friendCount = reviews.filter((r) => r.friendliness).length;
        if (friendCount > 0) {
          stats.average_friendliness = (
            reviews.reduce((sum, r) => sum + (r.friendliness || 0), 0) / friendCount
          ).toFixed(2);
        }

        const recommendCount = reviews.filter((r) => r.would_recommend).length;
        stats.recommend_percentage = ((recommendCount / reviews.length) * 100).toFixed(1);
      }

      res.json({
        success: true,
        data: {
          reviews,
          stats,
        },
      });
    } catch (error) {
      logger.error('Get agent reviews error:', error);
      next(error);
    }
  },

  // List client's own tickets (authenticated client)
  async listMyTickets(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        search,
      } = req.query;

      const tenant_id = req.user?.tenant_id;
      if (!tenant_id) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const offset = (page - 1) * limit;
      const where = { tenant_id };

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;

      if (search) {
        where[Op.or] = [
          { ticket_number: { [Op.like]: `%${search}%` } },
          { subject: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await SupportTicket.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('List my tickets error:', error);
      next(error);
    }
  },

  // Get client's own ticket with messages (authenticated client)
  async getMyTicket(req, res, next) {
    try {
      const { id } = req.params;
      const tenant_id = req.user?.tenant_id;

      if (!tenant_id) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const ticket = await SupportTicket.findOne({
        where: { id, tenant_id },
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['id', 'name', 'email', 'role'],
          },
          {
            model: TicketMessage,
            as: 'messages',
            order: [['createdAt', 'ASC']],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: SupportAgentReview,
            as: 'review',
          },
        ],
      });

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Get my ticket error:', error);
      next(error);
    }
  },
};

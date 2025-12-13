const bcrypt = require('bcryptjs');
const { signTokens, revokeSession } = require('../utils/jwt');
const { User, Tenant } = require('../models');

module.exports = {
  async register(req, res, next) {
    try {
      const { email, password, company_name } = req.body;
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: 'User already exists' });
      }
      const tenant = await Tenant.create({ company_name });
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password_hash,
        tenant_id: tenant.id,
        role: 'user',
      });
      const tokens = await signTokens({ id: user.id, tenant_id: tenant.id, role: user.role });
      return res.status(201).json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          tenant_id: tenant.id, 
          role: user.role 
        }, 
        ...tokens 
      });
    } catch (err) {
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.password_hash || '');
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const tokens = await signTokens({ id: user.id, tenant_id: user.tenant_id, role: user.role });
      return res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          tenant_id: user.tenant_id, 
          role: user.role,
          full_name: user.full_name 
        }, 
        ...tokens 
      });
    } catch (err) {
      return next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const { jti } = req.body;
      if (req.user && jti) {
        await revokeSession(req.user.sub || req.user.id, jti);
      }
      return res.json({ message: 'Logged out' });
    } catch (err) {
      return next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const { refreshAccessToken } = require('../utils/jwt');
      const tokens = await refreshAccessToken(refreshToken);

      if (!tokens) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      return res.json(tokens);
    } catch (err) {
      return next(err);
    }
  },
};



const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { signTokens, revokeSession } = require('../utils/jwt');
const { User, Tenant } = require('../models');
const { uploadDir } = require('../config/multer');

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
        password: password_hash, // Use password field as per User model
        tenant_id: tenant.id,
        role: 'user',
        name: company_name || email, // Add name field
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
      // Use password field (not password_hash) as per User model
      const passwordToCompare = user.password || user.password_hash || '';
      const valid = await bcrypt.compare(password, passwordToCompare);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const tokens = await signTokens({ id: user.id, tenant_id: user.tenant_id || null, role: user.role });
      return res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          tenant_id: user.tenant_id || null, 
          role: user.role,
          full_name: user.name || user.full_name || null,
          profile_image: user.profile_image || null
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

  async getProfile(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      // Check if user is in tenant database or master database
      let user = null;
      
      try {
        if (req.tenantModels && req.tenantModels.User) {
          // Tenant user
          user = await req.tenantModels.User.findByPk(userId);
        } else {
          // Admin user (master database)
          user = await User.findByPk(userId);
        }
      } catch (dbError) {
        // If database query fails, log but continue with JWT data
        console.error('Database error fetching user:', dbError);
      }

      // If user not found in database, use JWT token data as fallback
      if (!user) {
        // Return user data from JWT token
        const userData = {
          id: userId,
          email: req.user?.email || req.user?.email_address || '',
          name: req.user?.name || req.user?.full_name || '',
          role: req.user?.role || req.role || '',
          phone: req.user?.phone || '',
          profile_image: req.user?.profile_image || null,
          is_active: req.user?.is_active !== undefined ? req.user.is_active : true,
          last_login: req.user?.last_login || null,
        };

        return res.json({ 
          success: true,
          data: userData 
        });
      }

      // Return user data without sensitive information
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name || user.full_name,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        is_active: user.is_active,
        last_login: user.last_login,
      };

      return res.json({ 
        success: true,
        data: userData 
      });
    } catch (err) {
      return next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { name, email, phone } = req.body;

      // Get user from appropriate database
      let user = null;
      
      if (req.tenantModels && req.tenantModels.User) {
        // Tenant user
        user = await req.tenantModels.User.findByPk(userId);
      } else {
        // Admin user (master database)
        user = await User.findByPk(userId);
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        let existingUser = null;
        if (req.tenantModels && req.tenantModels.User) {
          existingUser = await req.tenantModels.User.findOne({ where: { email } });
        } else {
          existingUser = await User.findOne({ where: { email } });
        }
        
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }

      // Update user profile
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      await user.update(updateData);

      // Return updated user data
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name || user.full_name,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        is_active: user.is_active,
        last_login: user.last_login,
      };

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: userData,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  async uploadProfileImage(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get user from appropriate database
      let user = null;
      
      if (req.tenantModels && req.tenantModels.User) {
        // Tenant user
        user = await req.tenantModels.User.findByPk(userId);
      } else {
        // Admin user (master database)
        user = await User.findByPk(userId);
      }

      if (!user) {
        // Delete uploaded file if user not found
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete old profile image if exists
      if (user.profile_image) {
        const oldImagePath = path.isAbsolute(user.profile_image) 
          ? user.profile_image 
          : path.join(uploadDir, user.profile_image);
        
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            // Log error but don't fail the request
            console.error('Error deleting old profile image:', err);
          }
        }
      }

      // Save relative path from upload directory
      const relativePath = path.relative(uploadDir, req.file.path);
      const profileImagePath = relativePath.replace(/\\/g, '/'); // Normalize path separators

      // Update user profile image
      await user.update({ profile_image: profileImagePath });

      return res.json({
        message: 'Profile image uploaded successfully',
        profile_image: profileImagePath,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.full_name,
          profile_image: profileImagePath,
        },
      });
    } catch (err) {
      // Delete uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting uploaded file:', unlinkErr);
        }
      }
      return next(err);
    }
  },
};



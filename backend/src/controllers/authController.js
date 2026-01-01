const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { signTokens, revokeSession } = require('../utils/jwt');
const { User } = require('../models');
const { uploadDir } = require('../config/multer');

// Lazy load masterModels to avoid circular dependency issues
let masterModels;
function getMasterModels() {
  if (!masterModels) {
    try {
      masterModels = require('../models/masterModels');
      if (!masterModels || !masterModels.TenantMaster) {
        console.error('ERROR: masterModels.TenantMaster is not available');
        throw new Error('TenantMaster model not loaded');
      }
    } catch (error) {
      console.error('ERROR loading masterModels:', error);
      throw error;
    }
  }
  return masterModels;
}

module.exports = {
  async register(req, res, next) {
    try {
      const { email, password, company_name } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required for registration' });
      }
      
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Get masterModels (lazy load to avoid circular dependency issues)
      const masterModels = getMasterModels();
      
      // Ensure TenantMaster model is available
      if (!masterModels || !masterModels.TenantMaster) {
        console.error('ERROR: TenantMaster model not available in masterModels');
        console.error('masterModels keys:', masterModels ? Object.keys(masterModels) : 'masterModels is null/undefined');
        return res.status(500).json({ message: 'Server configuration error: TenantMaster model not available' });
      }

      // Check if tenant already exists with this email
      const existingTenant = await masterModels.TenantMaster.findOne({ where: { email } });
      if (existingTenant) {
        return res.status(409).json({ message: 'Account with this email already exists' });
      }

      // Generate unique subdomain based on company name or email
      const normalizedEmail = email.toLowerCase().trim();
      const baseSubdomain = company_name 
        ? company_name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30)
        : normalizedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let subdomain = baseSubdomain;
      let subdomainExists = await masterModels.TenantMaster.findOne({ where: { subdomain } });
      let counter = 1;
      
      // Keep trying until we find a unique subdomain
      while (subdomainExists) {
        subdomain = `${baseSubdomain}${counter}`;
        subdomainExists = await masterModels.TenantMaster.findOne({ where: { subdomain } });
        counter++;
      }

      // Set trial period (30 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      // Create tenant in master database
      const tenant = await masterModels.TenantMaster.create({
        email: normalizedEmail,
        company_name: company_name || normalizedEmail.split('@')[0],
        subdomain: subdomain,
        is_trial: true,
        trial_ends_at: trialEnd,
        subscription_plan: 'trial',
        acquisition_category: 'organic',
        is_active: true,
        db_provisioned: false,
      });
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: normalizedEmail,
        password: password_hash, // Use password field as per User model
        tenant_id: tenant.id,
        role: 'tenant_admin', // First user for tenant should be admin
        name: company_name || normalizedEmail.split('@')[0], // Add name field
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
      const { email, password, company_id } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Log login attempt (without password)
      console.log(`Login attempt for email: ${email}`);
      
      // Normalize email for search (lowercase, trim)
      const normalizedEmail = email.toLowerCase().trim();
      
      // First, try to find user in users table (master database)
      // Try exact match first, then case-insensitive
      let user = await User.findOne({ 
        where: { 
          email: normalizedEmail 
        } 
      });
      
      // If not found, try case-insensitive search (in case email was stored with different case)
      if (!user) {
        const { Op } = require('sequelize');
        user = await User.findOne({ 
          where: { 
            email: { [Op.like]: normalizedEmail }
          } 
        });
      }
      
      // If user not found, check tenant_master table
      if (!user) {
        console.log(`User not found in users table, checking tenant_master for email: ${email}`);
        const masterModels = getMasterModels();
        const tenant = await masterModels.TenantMaster.findOne({ where: { email } });
        
        if (tenant) {
          console.log(`Tenant found in tenant_master: ${tenant.id}`);
          
          // Check if user exists by tenant_id (maybe email search failed due to case sensitivity)
          user = await User.findOne({ 
            where: { 
              tenant_id: tenant.id 
            } 
          });
          
          if (!user) {
            // User doesn't exist in users table but tenant exists
            // This means user creation failed during tenant creation
            // For existing tenants, create the user now with the provided password
            console.log(`Tenant found (${tenant.id}) but user not created. Creating user now.`);
            console.log(`Tenant email: ${tenant.email}, Company: ${tenant.company_name}`);
            
            try {
              const bcrypt = require('bcryptjs');
              const password_hash = await bcrypt.hash(password, 10);
              
              user = await User.create({
                email: normalizedEmail,
                password: password_hash,
                name: tenant.company_name || normalizedEmail,
                tenant_id: tenant.id,
                role: 'tenant_admin',
              });
              
              console.log(`User created successfully for tenant ${tenant.id}: ${user.id}`);
            } catch (createError) {
              console.error(`Failed to create user for tenant ${tenant.id}:`, createError);
              return res.status(500).json({ 
                message: 'Failed to create user account. Please contact administrator.' 
              });
            }
          } else {
            // User found by tenant_id, verify email matches
            if (user.email.toLowerCase() !== email.toLowerCase()) {
              console.error(`Email mismatch: user email ${user.email} vs login email ${email}`);
              return res.status(401).json({ message: 'Invalid credentials' });
            }
            console.log(`User found by tenant_id: ${user.id}, email: ${user.email}`);
          }
        } else {
          console.log(`User not found in users table or tenant_master for email: ${email}`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }

      console.log(`User found: ${user.id}, role: ${user.role}, tenant_id: ${user.tenant_id}`);
      console.log(`User has password field: ${!!user.password}, has password_hash: ${!!user.password_hash}`);
      
      // Check if user is a Google OAuth user (has google_id but no password)
      if (user.google_id && !user.password) {
        return res.status(401).json({ 
          message: 'This account uses Google Sign-In. Please use Google to login.',
          use_google_login: true 
        });
      }
      
      // Use password field (not password_hash) as per User model
      const passwordToCompare = user.password || user.password_hash || '';
      
      if (!passwordToCompare) {
        console.error(`User ${user.id} has no password stored`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, passwordToCompare);
      
      if (!valid) {
        console.log(`Password comparison failed for user: ${user.id}`);
        console.log(`Password hash stored (first 20 chars): ${passwordToCompare.substring(0, 20)}...`);
        console.log(`Password being compared: ${password ? '[provided]' : '[missing]'}`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log(`Login successful for user: ${user.id}, role: ${user.role}`);

      // If this is a tenant-side user, require a company selection (or auto-pick if only one)
      let selectedCompany = null;
      if (user.tenant_id && ['tenant_admin', 'user', 'accountant'].includes(user.role)) {
        const masterModels = getMasterModels();
        const companies = await masterModels.Company.findAll({
          where: { tenant_id: user.tenant_id, is_active: true },
          attributes: ['id', 'company_name', 'db_provisioned'],
          order: [['createdAt', 'DESC']],
        });

        if (companies.length === 0) {
          // Still generate tokens and return user data so user can be authenticated
          // This allows them to access the company creation page
          const tokens = await signTokens({
            id: user.id,
            tenant_id: user.tenant_id || null,
            company_id: null, // No company yet
            role: user.role,
          });

          return res.status(409).json({
            message: 'No company found. Please create your company first.',
            needs_company_creation: true,
            user: {
              id: user.id,
              email: user.email,
              tenant_id: user.tenant_id || null,
              company_id: null,
              company_name: null,
              role: user.role,
              full_name: user.name || user.full_name || null,
              profile_image: user.profile_image || null,
            },
            ...tokens,
          });
        }

        if (companies.length === 1) {
          selectedCompany = companies[0];
        } else {
          if (!company_id) {
            return res.status(400).json({
              message: 'Company selection required',
              require_company: true,
              companies,
            });
          }
          selectedCompany = companies.find((c) => c.id === company_id);
          if (!selectedCompany) {
            return res.status(403).json({ message: 'Invalid company selection' });
          }
        }

        if (!selectedCompany.db_provisioned) {
          return res.status(503).json({
            message: 'Company database is being provisioned',
            company_id: selectedCompany.id,
          });
        }
      }

      const tokens = await signTokens({
        id: user.id,
        tenant_id: user.tenant_id || null,
        company_id: selectedCompany?.id || null,
        role: user.role,
      });

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id || null,
          company_id: selectedCompany?.id || null,
          company_name: selectedCompany?.company_name || null,
          role: user.role,
          full_name: user.name || user.full_name || null,
          profile_image: user.profile_image || null,
        },
        ...tokens,
      });
    } catch (err) {
      console.error('Login error:', err);
      return next(err);
    }
  },

  async googleCallback(req, res, next) {
    try {
      const user = req.user; // User from passport strategy
      
      if (!user) {
        return res.status(401).json({ message: 'Google authentication failed' });
      }

      // Handle company selection for tenant users (similar to regular login)
      let selectedCompany = null;
      let needsCompanyCreation = false;
      
      if (user.tenant_id && ['tenant_admin', 'user', 'accountant'].includes(user.role)) {
        const masterModels = getMasterModels();
        const companies = await masterModels.Company.findAll({
          where: { tenant_id: user.tenant_id, is_active: true },
        });

        if (companies.length === 0) {
          // User has tenant but no company - needs to create company
          needsCompanyCreation = true;
        } else if (companies.length === 1) {
          // If only one company, auto-select it
          selectedCompany = companies[0];
        } else {
          // Multiple companies - check if company_id provided in query
          const { company_id } = req.query;
          if (company_id) {
            selectedCompany = companies.find((c) => c.id === company_id);
            if (!selectedCompany) {
              return res.status(400).json({ message: 'Invalid company selected' });
            }
          } else {
            // Return companies list for user to select
            return res.status(200).json({
              message: 'Multiple companies found. Please select one.',
              companies: companies.map((c) => ({
                id: c.id,
                company_name: c.company_name,
              })),
              user: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant_id,
                role: user.role,
              },
            });
          }
        }

        if (selectedCompany && !selectedCompany.db_provisioned) {
          return res.status(503).json({
            message: 'Company database is being provisioned',
            company_id: selectedCompany.id,
          });
        }
      } else if (!user.tenant_id) {
        // New Google user without a tenant - needs to create company
        needsCompanyCreation = true;
      }

      // Generate JWT tokens
      const tokens = await signTokens({
        id: user.id,
        tenant_id: user.tenant_id || null,
        company_id: selectedCompany?.id || null,
        role: user.role,
      });

      // Determine frontend URL based on user type
      const mainDomain = process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      let frontendUrl;
      
      // Always use role-based subdomain redirect for better user experience
      // This ensures users land on the correct portal (client or admin)
      if (['super_admin', 'admin'].includes(user.role)) {
        frontendUrl = process.env.NODE_ENV === 'production' 
          ? `${protocol}://admin.${mainDomain}`
          : 'http://admin.localhost:3001';
      } else if (user.tenant_id || ['tenant_admin', 'user', 'accountant'].includes(user.role)) {
        frontendUrl = process.env.NODE_ENV === 'production'
          ? `${protocol}://client.${mainDomain}`
          : 'http://client.localhost:3001';
      } else {
        // Fallback to main domain or FRONTEND_URL if explicitly set
        frontendUrl = process.env.FRONTEND_URL || (
          process.env.NODE_ENV === 'production'
            ? `${protocol}://${mainDomain}`
            : 'http://localhost:3001'
        );
      }

      // Build redirect URL based on whether user needs company creation
      let redirectUrl;
      if (needsCompanyCreation) {
        // User needs to create a company - redirect to company creation with tokens
        redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&jti=${tokens.jti}&needsCompany=true`;
      } else {
        // User has company - redirect to normal callback
        redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&jti=${tokens.jti}`;
      }

      // If request expects JSON (API call), return JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          user: {
            id: user.id,
            email: user.email,
            tenant_id: user.tenant_id || null,
            company_id: selectedCompany?.id || null,
            company_name: selectedCompany?.company_name || null,
            role: user.role,
            full_name: user.name || user.full_name || null,
            profile_image: user.profile_image || null,
          },
          needsCompanyCreation,
          ...tokens,
        });
      }

      // Otherwise redirect to frontend
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
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

  async switchCompany(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.sub;
      const tenantId = req.tenant_id;
      const role = req.role;
      const { company_id } = req.body || {};

      if (!userId || !tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!['tenant_admin', 'user', 'accountant'].includes(role)) {
        return res.status(403).json({ message: 'Company switching is only for tenant users' });
      }

      if (!company_id) {
        return res.status(400).json({ message: 'company_id is required' });
      }

      const masterModels = getMasterModels();
      const company = await masterModels.Company.findOne({
        where: { id: company_id, tenant_id: tenantId, is_active: true },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (!company.db_provisioned) {
        return res.status(503).json({ message: 'Company database is being provisioned' });
      }

      const tokens = await signTokens({
        id: userId,
        tenant_id: tenantId,
        company_id: company.id,
        role,
      });

      return res.json({
        user: {
          id: userId,
          tenant_id: tenantId,
          company_id: company.id,
          company_name: company.company_name,
          role,
        },
        ...tokens,
      });
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

      const { name, email, phone, password, current_password } = req.body;

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

      // Handle password change if provided
      if (password) {
        // Verify current password if provided
        if (current_password) {
          const bcrypt = require('bcryptjs');
          const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
          if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
          }
        }

        // Hash and update new password
        const bcrypt = require('bcryptjs');
        updateData.password = await bcrypt.hash(password, 10);
      }

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



require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Tenant Connection Manager
 * Manages database connections for each tenant
 * Implements connection pooling and caching
 */
class TenantConnectionManager {
  constructor() {
    // Cache of active tenant connections
    this.connections = new Map();
    
    // Maximum number of tenant connections to keep in cache
    this.maxCachedConnections = parseInt(process.env.MAX_TENANT_CONNECTIONS) || 50;
    
    // Connection timeout (5 minutes of inactivity)
    this.connectionTimeout = 5 * 60 * 1000;
    
    // Track last access time for each connection
    this.lastAccessTime = new Map();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get database connection for a tenant
   * @param {Object} tenantConfig - Tenant database configuration
   * @returns {Sequelize} - Sequelize instance for the tenant
   */
  async getConnection(tenantConfig) {
    const { id, db_name, db_host, db_port, db_user, db_password } = tenantConfig;

    // Return cached connection if available
    if (this.connections.has(id)) {
      this.lastAccessTime.set(id, Date.now());
      return this.connections.get(id);
    }

    // Check if we need to clean up old connections
    if (this.connections.size >= this.maxCachedConnections) {
      await this.cleanupOldConnections();
    }

    try {
      // Create new connection
      const sequelize = new Sequelize(db_name, db_user, db_password, {
        host: db_host || process.env.DB_HOST || 'localhost',
        port: db_port || process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });

      // Test the connection
      await sequelize.authenticate();
      logger.info(`Connected to tenant database: ${db_name}`);

      // Cache the connection
      this.connections.set(id, sequelize);
      this.lastAccessTime.set(id, Date.now());

      return sequelize;
    } catch (error) {
      logger.error(`Failed to connect to tenant database ${db_name}:`, error);
      throw new Error(`Failed to connect to tenant database: ${error.message}`);
    }
  }

  /**
   * Close connection for a specific tenant
   * @param {string} tenantId - Tenant ID
   */
  async closeConnection(tenantId) {
    if (this.connections.has(tenantId)) {
      const connection = this.connections.get(tenantId);
      await connection.close();
      this.connections.delete(tenantId);
      this.lastAccessTime.delete(tenantId);
      logger.info(`Closed connection for tenant: ${tenantId}`);
    }
  }

  /**
   * Close all tenant connections
   */
  async closeAllConnections() {
    const closePromises = [];
    for (const [tenantId, connection] of this.connections.entries()) {
      closePromises.push(connection.close());
    }
    await Promise.all(closePromises);
    this.connections.clear();
    this.lastAccessTime.clear();
    logger.info('Closed all tenant connections');
  }

  /**
   * Clean up old inactive connections
   */
  async cleanupOldConnections() {
    const now = Date.now();
    const connectionsToClose = [];

    for (const [tenantId, lastAccess] of this.lastAccessTime.entries()) {
      if (now - lastAccess > this.connectionTimeout) {
        connectionsToClose.push(tenantId);
      }
    }

    // Close oldest connections if still over limit
    if (connectionsToClose.length === 0 && this.connections.size >= this.maxCachedConnections) {
      const sortedConnections = Array.from(this.lastAccessTime.entries())
        .sort((a, b) => a[1] - b[1]);
      
      const numToClose = Math.ceil(this.maxCachedConnections * 0.2); // Close 20%
      connectionsToClose.push(...sortedConnections.slice(0, numToClose).map(([id]) => id));
    }

    for (const tenantId of connectionsToClose) {
      await this.closeConnection(tenantId);
    }

    if (connectionsToClose.length > 0) {
      logger.info(`Cleaned up ${connectionsToClose.length} inactive tenant connections`);
    }
  }

  /**
   * Start periodic cleanup of old connections
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldConnections().catch((error) => {
        logger.error('Error during connection cleanup:', error);
      });
    }, 60000); // Run every minute
  }

  /**
   * Get statistics about current connections
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      maxCachedConnections: this.maxCachedConnections,
      cachedTenants: Array.from(this.connections.keys()),
    };
  }
}

// Export singleton instance
module.exports = new TenantConnectionManager();

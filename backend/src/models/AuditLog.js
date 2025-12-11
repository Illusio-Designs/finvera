module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: true }, // null for platform-level actions
      user_id: { type: DataTypes.UUID, allowNull: false },
      action: { type: DataTypes.STRING(50), allowNull: false }, // create, update, delete, view, login, etc.
      entity_type: { type: DataTypes.STRING(50), allowNull: false }, // Voucher, Ledger, User, etc.
      entity_id: DataTypes.UUID,
      old_values: DataTypes.JSON,
      new_values: DataTypes.JSON,
      ip_address: DataTypes.STRING(45),
      user_agent: DataTypes.TEXT,
      description: DataTypes.TEXT,
    },
    { tableName: 'audit_logs', timestamps: true }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.Tenant, { foreignKey: 'tenant_id', required: false });
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return AuditLog;
};


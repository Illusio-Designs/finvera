module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company_name: { type: DataTypes.STRING, allowNull: false },
      gstin: DataTypes.STRING(15),
      pan: DataTypes.STRING(10),
      subscription_plan: DataTypes.STRING,
      subscription_start: DataTypes.DATE,
      subscription_end: DataTypes.DATE,
      salesman_id: DataTypes.UUID,
      distributor_id: DataTypes.UUID,
      referral_code: DataTypes.STRING(20),
      referred_by: DataTypes.UUID,
      referral_type: DataTypes.STRING(20),
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      address: DataTypes.TEXT,
      city: DataTypes.STRING(100),
      state: DataTypes.STRING(100),
      pincode: DataTypes.STRING(10),
      phone: DataTypes.STRING(15),
      email: DataTypes.STRING(255),
      tan: DataTypes.STRING(10), // TAN for TDS
    },
    {
      tableName: 'tenants',
      timestamps: true,
    },
  );

  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.GSTIN, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.Voucher, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.Ledger, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.AccountGroup, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.Commission, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.ReferralReward, { foreignKey: 'referee_tenant_id' });
    Tenant.hasMany(models.GSTRReturn, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.TDSDetail, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.EInvoice, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.AuditLog, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.BillWiseDetail, { foreignKey: 'tenant_id' });
    Tenant.hasMany(models.VoucherLedgerEntry, { foreignKey: 'tenant_id' });
  };

  return Tenant;
};

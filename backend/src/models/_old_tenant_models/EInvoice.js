module.exports = (sequelize, DataTypes) => {
  const EInvoice = sequelize.define(
    'EInvoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
      },
      voucher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      irn: DataTypes.STRING(100),
      ack_no: DataTypes.STRING(50),
      ack_date: DataTypes.DATE,
      qr_code: DataTypes.TEXT,
      signed_invoice: DataTypes.TEXT,
      cancel_reason: DataTypes.STRING(100),
      cancel_remark: DataTypes.TEXT,
      canceled_at: DataTypes.DATE,
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'e_invoices',
      timestamps: true,
    }
  );

  EInvoice.associate = (models) => {
    EInvoice.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EInvoice.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  };

  return EInvoice;
};

module.exports = (sequelize, DataTypes) => {
  const EInvoice = sequelize.define(
    'EInvoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: false },
      voucher_id: { type: DataTypes.UUID, allowNull: false },
      irn: { type: DataTypes.STRING(64), unique: true },
      ack_number: DataTypes.STRING(50),
      ack_date: DataTypes.DATE,
      qr_code: DataTypes.TEXT,
      e_invoice_json: DataTypes.JSON,
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
      }, // pending, generated, cancelled, failed
      error_message: DataTypes.TEXT,
      cancelled_irn: DataTypes.STRING(64),
      cancellation_reason: DataTypes.STRING(100),
      cancellation_date: DataTypes.DATE,
    },
    { tableName: 'e_invoices', timestamps: true }
  );

  EInvoice.associate = (models) => {
    EInvoice.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EInvoice.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  };

  return EInvoice;
};


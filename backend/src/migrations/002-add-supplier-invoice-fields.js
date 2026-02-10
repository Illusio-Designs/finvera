const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    // Add supplier invoice fields to vouchers table
    const tableDescription = await queryInterface.describeTable('vouchers');
    
    if (!tableDescription.supplier_invoice_number) {
      await queryInterface.addColumn('vouchers', 'supplier_invoice_number', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Supplier invoice number for purchase invoices'
      });
      console.log('✓ Added supplier_invoice_number column to vouchers');
    }
    
    if (!tableDescription.supplier_invoice_date) {
      await queryInterface.addColumn('vouchers', 'supplier_invoice_date', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Supplier invoice date for purchase invoices'
      });
      console.log('✓ Added supplier_invoice_date column to vouchers');
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('vouchers', 'supplier_invoice_number');
    await queryInterface.removeColumn('vouchers', 'supplier_invoice_date');
  }
};

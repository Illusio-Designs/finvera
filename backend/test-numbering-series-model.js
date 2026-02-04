/**
 * Test script for NumberingSeries model
 * This script tests the validations and basic functionality of the NumberingSeries model
 */

const { Sequelize } = require('sequelize');
const config = require('./config/config');
const tenantModels = require('./src/services/tenantModels');

// Use test database configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false, // Disable logging for cleaner output
  }
);

// Initialize models
const models = tenantModels(sequelize);

async function testNumberingSeriesModel() {
  console.log('🧪 Testing NumberingSeries Model...\n');

  try {
    // Test 1: Create a valid NumberingSeries
    console.log('Test 1: Creating a valid NumberingSeries...');
    const validSeries = await models.NumberingSeries.create({
      tenant_id: 'test-tenant-001',
      voucher_type: 'Sales Invoice',
      series_name: 'Default Sales Series',
      prefix: 'INV',
      format: 'PREFIX-YEAR-SEQUENCE',
      separator: '-',
      sequence_length: 4,
      current_sequence: 0,
      start_number: 1,
      reset_frequency: 'yearly',
      is_default: true,
      is_active: true,
    });
    console.log('✅ Valid series created successfully:', validSeries.id);
    console.log('   Series Name:', validSeries.series_name);
    console.log('   Format:', validSeries.format);
    console.log('   Prefix:', validSeries.prefix);

    // Test 2: Test format validation - missing PREFIX token
    console.log('\nTest 2: Testing format validation (missing PREFIX token)...');
    try {
      await models.NumberingSeries.create({
        tenant_id: 'test-tenant-001',
        voucher_type: 'Sales Invoice',
        series_name: 'Invalid Series 1',
        prefix: 'INV',
        format: 'YEAR-SEQUENCE', // Missing PREFIX
        separator: '-',
        sequence_length: 4,
        is_default: false,
        is_active: true,
      });
      console.log('❌ FAILED: Should have thrown validation error for missing PREFIX token');
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log('✅ Validation error caught correctly:', error.errors[0].message);
      } else {
        throw error;
      }
    }

    // Test 3: Test format validation - missing SEQUENCE token
    console.log('\nTest 3: Testing format validation (missing SEQUENCE token)...');
    try {
      await models.NumberingSeries.create({
        tenant_id: 'test-tenant-001',
        voucher_type: 'Sales Invoice',
        series_name: 'Invalid Series 2',
        prefix: 'INV',
        format: 'PREFIX-YEAR', // Missing SEQUENCE
        separator: '-',
        sequence_length: 4,
        is_default: false,
        is_active: true,
      });
      console.log('❌ FAILED: Should have thrown validation error for missing SEQUENCE token');
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log('✅ Validation error caught correctly:', error.errors[0].message);
      } else {
        throw error;
      }
    }

    // Test 4: Test prefix validation - lowercase letters
    console.log('\nTest 4: Testing prefix validation (lowercase letters)...');
    try {
      await models.NumberingSeries.create({
        tenant_id: 'test-tenant-001',
        voucher_type: 'Sales Invoice',
        series_name: 'Invalid Series 3',
        prefix: 'inv', // Lowercase - should fail
        format: 'PREFIX-YEAR-SEQUENCE',
        separator: '-',
        sequence_length: 4,
        is_default: false,
        is_active: true,
      });
      console.log('❌ FAILED: Should have thrown validation error for lowercase prefix');
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log('✅ Validation error caught correctly:', error.errors[0].message);
      } else {
        throw error;
      }
    }

    // Test 5: Test prefix validation - special characters
    console.log('\nTest 5: Testing prefix validation (special characters)...');
    try {
      await models.NumberingSeries.create({
        tenant_id: 'test-tenant-001',
        voucher_type: 'Sales Invoice',
        series_name: 'Invalid Series 4',
        prefix: 'INV-', // Contains hyphen - should fail
        format: 'PREFIX-YEAR-SEQUENCE',
        separator: '-',
        sequence_length: 4,
        is_default: false,
        is_active: true,
      });
      console.log('❌ FAILED: Should have thrown validation error for special characters in prefix');
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log('✅ Validation error caught correctly:', error.errors[0].message);
      } else {
        throw error;
      }
    }

    // Test 6: Test valid prefix with numbers
    console.log('\nTest 6: Testing valid prefix with numbers...');
    const seriesWithNumbers = await models.NumberingSeries.create({
      tenant_id: 'test-tenant-001',
      voucher_type: 'Sales Invoice',
      series_name: 'Series with Numbers',
      prefix: 'INV2024', // Uppercase alphanumeric - should pass
      format: 'PREFIX-SEQUENCE',
      separator: '-',
      sequence_length: 4,
      is_default: false,
      is_active: true,
    });
    console.log('✅ Valid series with numbers created successfully:', seriesWithNumbers.id);
    console.log('   Prefix:', seriesWithNumbers.prefix);

    // Test 7: Verify all fields are stored correctly
    console.log('\nTest 7: Verifying all fields are stored correctly...');
    const retrievedSeries = await models.NumberingSeries.findByPk(validSeries.id);
    console.log('✅ Series retrieved successfully');
    console.log('   ID:', retrievedSeries.id);
    console.log('   Tenant ID:', retrievedSeries.tenant_id);
    console.log('   Voucher Type:', retrievedSeries.voucher_type);
    console.log('   Series Name:', retrievedSeries.series_name);
    console.log('   Prefix:', retrievedSeries.prefix);
    console.log('   Format:', retrievedSeries.format);
    console.log('   Separator:', retrievedSeries.separator);
    console.log('   Sequence Length:', retrievedSeries.sequence_length);
    console.log('   Current Sequence:', retrievedSeries.current_sequence);
    console.log('   Start Number:', retrievedSeries.start_number);
    console.log('   Reset Frequency:', retrievedSeries.reset_frequency);
    console.log('   Is Default:', retrievedSeries.is_default);
    console.log('   Is Active:', retrievedSeries.is_active);
    console.log('   Created At:', retrievedSeries.createdAt);
    console.log('   Updated At:', retrievedSeries.updatedAt);

    // Cleanup: Delete test records
    console.log('\n🧹 Cleaning up test records...');
    await models.NumberingSeries.destroy({
      where: {
        tenant_id: 'test-tenant-001',
      },
    });
    console.log('✅ Test records cleaned up');

    console.log('\n✅ All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run tests
testNumberingSeriesModel()
  .then(() => {
    console.log('\n🎉 Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

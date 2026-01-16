
const { DataTypes } = require('sequelize');
const { getMasterDatabase } = require('../config/database');

const Branch = getMasterDatabase().define('Branch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies', 
            key: 'id',
        },
    },
    branch_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gstin: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'branches',
    timestamps: true,
});

module.exports = Branch;


const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

const Branch = masterSequelize.define('Branch', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    company_id: {
        type: DataTypes.UUID,
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

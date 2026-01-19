
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
    branch_code: {
        type: DataTypes.STRING,
        allowNull: true,
        // Remove unique: true from here to prevent duplicate index creation
    },
    gstin: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'branches',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['branch_code'],
            name: 'branch_code_unique'
        }
    ]
});

module.exports = Branch;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'website_manager'),
        allowNull: false,
        defaultValue: 'admin',
      },
      phone: DataTypes.STRING(15),
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login: DataTypes.DATE,
    },
    {
      tableName: 'users',
      timestamps: true,
    }
  );

  // Admin users don't need associations in main DB
  // Tenant users are in tenant databases
  User.associate = (models) => {
    // No associations needed for admin users
  };

  return User;
};

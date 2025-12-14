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
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin',
      },
      phone: DataTypes.STRING(15),
      profile_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to user profile image',
      },
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

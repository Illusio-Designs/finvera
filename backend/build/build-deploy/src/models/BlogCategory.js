module.exports = (sequelize, DataTypes) => {
  const BlogCategory = sequelize.define(
    'BlogCategory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // Removed unique: true to avoid index limit issues
        // Uniqueness will be enforced at application level
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // Removed unique: true to avoid index limit issues
        // Uniqueness will be enforced at application level
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'blog_categories',
      timestamps: true,
      // Define indexes explicitly to avoid hitting MySQL's 64 index limit
      // Only add unique indexes if they don't already exist
      indexes: [
        // Note: Unique indexes removed to prevent "too many keys" error
        // Uniqueness should be enforced at application level or via migration
      ],
    }
  );

  BlogCategory.associate = (models) => {
    BlogCategory.hasMany(models.Blog, { foreignKey: 'category_id', as: 'blogs' });
  };

  return BlogCategory;
};

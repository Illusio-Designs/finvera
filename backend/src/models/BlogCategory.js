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
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
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
    }
  );

  BlogCategory.associate = (models) => {
    BlogCategory.hasMany(models.Blog, { foreignKey: 'category_id', as: 'blogs' });
  };

  return BlogCategory;
};

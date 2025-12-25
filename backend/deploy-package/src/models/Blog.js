module.exports = (sequelize, DataTypes) => {
  const Blog = sequelize.define(
    'Blog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      excerpt: {
        type: DataTypes.TEXT,
        comment: 'Short description/summary',
      },
      content: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      featured_image: {
        type: DataTypes.STRING(500),
        comment: 'URL or path to featured image',
      },
      author_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User ID of author (website_manager)',
      },
      category_id: {
        type: DataTypes.UUID,
        comment: 'Blog category',
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of tags',
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
      },
      is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Show on homepage/featured section',
      },
      views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      published_at: {
        type: DataTypes.DATE,
      },
      // SEO fields
      meta_title: {
        type: DataTypes.STRING(255),
      },
      meta_description: {
        type: DataTypes.TEXT,
      },
      meta_keywords: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: 'blogs',
      timestamps: true,
      indexes: [
        { fields: ['slug'] },
        { fields: ['status'] },
        { fields: ['author_id'] },
        { fields: ['category_id'] },
        { fields: ['published_at'] },
      ],
    }
  );

  Blog.associate = (models) => {
    Blog.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
    Blog.belongsTo(models.BlogCategory, { foreignKey: 'category_id', as: 'category' });
  };

  return Blog;
};

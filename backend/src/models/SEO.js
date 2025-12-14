module.exports = (sequelize, DataTypes) => {
  const SEO = sequelize.define(
    'SEO',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      page_type: {
        type: DataTypes.ENUM('home', 'about', 'contact', 'pricing', 'features', 'blog', 'custom'),
        allowNull: false,
      },
      page_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'URL path (e.g., /, /about, /pricing)',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Page title (for <title> tag)',
      },
      meta_description: {
        type: DataTypes.TEXT,
        comment: 'Meta description for search engines',
      },
      meta_keywords: {
        type: DataTypes.STRING(500),
        comment: 'Comma-separated keywords',
      },
      og_title: {
        type: DataTypes.STRING(255),
        comment: 'Open Graph title for social media',
      },
      og_description: {
        type: DataTypes.TEXT,
        comment: 'Open Graph description',
      },
      og_image: {
        type: DataTypes.STRING(500),
        comment: 'Open Graph image URL',
      },
      twitter_card: {
        type: DataTypes.ENUM('summary', 'summary_large_image', 'app', 'player'),
        defaultValue: 'summary_large_image',
      },
      canonical_url: {
        type: DataTypes.STRING(500),
        comment: 'Canonical URL to avoid duplicate content',
      },
      robots: {
        type: DataTypes.STRING(100),
        defaultValue: 'index, follow',
        comment: 'Robots meta tag (index, follow, noindex, nofollow)',
      },
      structured_data: {
        type: DataTypes.JSON,
        comment: 'JSON-LD structured data for rich snippets',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'seo_settings',
      timestamps: true,
      indexes: [
        { fields: ['page_type'] },
        { fields: ['page_path'], unique: true },
      ],
    }
  );

  return SEO;
};

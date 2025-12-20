'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      in_app_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      desktop_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sound_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      type_preferences: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('notification_preferences', ['user_id'], {
      unique: true,
      name: 'idx_notification_preferences_user_id_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_preferences');
  },
};

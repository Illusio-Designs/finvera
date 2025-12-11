const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const db = {};

// Read all model files
const modelsDir = __dirname;
const modelFiles = fs
  .readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'));

// Load all models
modelFiles.forEach((file) => {
  try {
    const modelModule = require(path.join(modelsDir, file));
    
    // Check if it's a function (Sequelize model definition)
    if (typeof modelModule === 'function') {
      const model = modelModule(sequelize, DataTypes);
      if (model && model.name) {
        db[model.name] = model;
      }
    }
  } catch (error) {
    // Skip files that can't be loaded (empty or invalid)
    console.warn(`Warning: Could not load model ${file}:`, error.message);
  }
});

// Run associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;

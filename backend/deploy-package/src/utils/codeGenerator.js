const { Op, Sequelize } = require('sequelize');

function normalizeOptionalCode(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Generate the next sequential code like PREFIX001, PREFIX002, ...
 * Uses MySQL: MAX(CAST(SUBSTRING(field, startPos) AS UNSIGNED)).
 */
async function generateNextSequentialCode({
  model,
  field,
  prefix,
  padLength = 3,
  transaction,
}) {
  const startPos = prefix.length + 1; // MySQL SUBSTRING is 1-indexed

  const rows = await model.findAll({
    attributes: [
      [
        Sequelize.fn(
          'MAX',
          Sequelize.cast(
            Sequelize.fn('SUBSTRING', Sequelize.col(field), startPos),
            'UNSIGNED'
          )
        ),
        'maxNum',
      ],
    ],
    where: {
      [field]: { [Op.like]: `${prefix}%` },
    },
    raw: true,
    transaction,
  });

  const maxNum = parseInt(rows?.[0]?.maxNum, 10) || 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
}

function isUniqueConstraintOnField(err, field) {
  return (
    err?.name === 'SequelizeUniqueConstraintError' &&
    Array.isArray(err.errors) &&
    err.errors.some((e) => e?.path === field)
  );
}

module.exports = {
  normalizeOptionalCode,
  generateNextSequentialCode,
  isUniqueConstraintOnField,
};


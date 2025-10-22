const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    hederaAccountId: Joi.string().pattern(/^0\.0\.\d+$/).optional(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  logEmission: Joi.object({
    emissionType: Joi.string().valid('travel', 'energy', 'food', 'other').required(),
    category: Joi.string().required(),
    amount: Joi.number().positive().required(),
    unit: Joi.string().required(),
    co2eKg: Joi.number().positive().optional(),
    date: Joi.date().optional(),
    description: Joi.string().max(500).optional()
  }),

  purchaseOffset: Joi.object({
    userHederaAddress: Joi.string().pattern(/^0\.0\.\d+$/).required(),
    projectId: Joi.string().required(),
    quantity: Joi.number().integer().positive().required(),
    totalCo2eKg: Joi.number().positive().required(),
    totalHbarCost: Joi.number().positive().required()
  }),

  redeemOffset: Joi.object({
    tokenAmount: Joi.number().integer().positive().required()
  }),

  calculateEmission: Joi.object({
    emissionType: Joi.string().valid('travel', 'energy', 'food', 'other').required(),
    category: Joi.string().required(),
    amount: Joi.number().positive().required(),
    unit: Joi.string().required()
  })
};

module.exports = { validate, schemas };
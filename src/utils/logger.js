const winston = require('winston');

const transports = [];

// Always add console transport
transports.push(new winston.transports.Console({
  format: winston.format.simple()
}));

// Only add file transports in non-serverless environments
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'carbon-offset-tracker' },
  transports
});

module.exports = logger;
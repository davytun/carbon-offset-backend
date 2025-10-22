const express = require('express');
const EmissionController = require('../controllers/emissionController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/emissions/log:
 *   post:
 *     summary: Log a carbon emission
 *     tags: [Emissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emissionType
 *               - category
 *               - amount
 *               - unit
 *             properties:
 *               emissionType:
 *                 type: string
 *                 enum: [travel, energy, food, other]
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               unit:
 *                 type: string
 *               co2eKg:
 *                 type: number
 *                 minimum: 0
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Emission logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     emission:
 *                       $ref: '#/components/schemas/Emission'
 *                     blockchain:
 *                       type: object
 *                       properties:
 *                         transactionId:
 *                           type: string
 *                         consensusTimestamp:
 *                           type: string
 *                         topicId:
 *                           type: string
 */

/**
 * @swagger
 * /api/emissions/history:
 *   get:
 *     summary: Get emission history
 *     tags: [Emissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: emissionType
 *         schema:
 *           type: string
 *           enum: [travel, energy, food, other]
 *     responses:
 *       200:
 *         description: Emission history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     emissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Emission'
 *                     pagination:
 *                       type: object
 *                     summary:
 *                       type: object
 */

/**
 * @swagger
 * /api/emissions/categories:
 *   get:
 *     summary: Get supported emission categories
 *     tags: [Emissions]
 *     responses:
 *       200:
 *         description: Emission categories retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */

router.use(authenticate);
router.use(generalLimiter);

router.post('/log', validate(schemas.logEmission), EmissionController.logEmission);
router.get('/history', EmissionController.getEmissionHistory);
router.get('/stats', EmissionController.getEmissionStats);
router.post('/calculate', validate(schemas.calculateEmission), EmissionController.calculateEmission);
router.get('/categories', EmissionController.getEmissionCategories);

module.exports = router;
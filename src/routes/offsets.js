const express = require('express');
const OffsetController = require('../controllers/offsetController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/offsets/marketplace:
 *   get:
 *     summary: Browse carbon offset projects
 *     tags: [Offsets]
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
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [reforestation, renewable_energy, methane_capture, direct_air_capture, other]
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                     pagination:
 *                       type: object
 */

/**
 * @swagger
 * /api/offsets/purchase:
 *   post:
 *     summary: Purchase carbon offset credits
 *     tags: [Offsets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userHederaAddress
 *               - projectId
 *               - quantity
 *               - totalCo2eKg
 *               - totalHbarCost
 *             properties:
 *               userHederaAddress:
 *                 type: string
 *                 pattern: '^0\.0\.\d+$'
 *               projectId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               totalCo2eKg:
 *                 type: number
 *                 minimum: 0
 *               totalHbarCost:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Offset purchased successfully
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
 *                     offset:
 *                       type: object
 *                     blockchain:
 *                       type: object
 *                       properties:
 *                         hbarTransactionId:
 *                           type: string
 *                         tokenMintTransactionId:
 *                           type: string
 *                         tokenId:
 *                           type: string
 */

router.get('/marketplace', generalLimiter, OffsetController.getMarketplace);

router.use(authenticate);
router.use(generalLimiter);

router.post('/purchase', validate(schemas.purchaseOffset), OffsetController.purchaseOffset);
router.post('/redeem', validate(schemas.redeemOffset), OffsetController.redeemOffset);
router.get('/balance', OffsetController.getBalance);
router.get('/history', OffsetController.getOffsetHistory);

module.exports = router;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, hederaAccountId, firstName, lastName } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new AppError('User already exists with this email', 400));
      }

      const user = new User({
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        hederaAccountId,
        profile: { firstName, lastName }
      });

      await user.save();
      const token = generateToken(user._id);

      logger.info(`New user registered: ${email}`);
      res.status(201).json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, isActive: true });
      if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Invalid email or password', 401));
      }

      const token = generateToken(user._id);

      logger.info(`User logged in: ${email}`);
      res.json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      res.json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, hederaAccountId } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          hederaAccountId
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
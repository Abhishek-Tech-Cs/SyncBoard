import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateToken, getCookieOptions } from '../utils/jwt.js';
import { sendEmail } from '../config/email.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      isVerified: true, // Mark verified for frictionless onboarding
      verificationToken,
    });

    const token = generateToken({ id: user._id });

    res.cookie('token', token, getCookieOptions());

    return ApiResponse.created(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          isVerified: user.isVerified,
        },
        token,
      },
      'User registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.lastActiveAt = new Date();
    await user.save();

    const token = generateToken({ id: user._id });
    res.cookie('token', token, getCookieOptions());

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          bio: user.bio,
          isVerified: user.isVerified,
        },
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return ApiResponse.success(res, null, 'Logged out successfully');
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, status } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (status) user.status = status;

    await user.save();

    return ApiResponse.success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success to avoid email enumeration
      return ApiResponse.success(res, null, 'If that email exists, a password reset link has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'SyncBoard — Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><a href="${resetUrl}">${resetUrl}</a><p>Link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });

    return ApiResponse.success(res, { resetToken }, 'Password reset instructions sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return ApiResponse.success(res, null, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
};


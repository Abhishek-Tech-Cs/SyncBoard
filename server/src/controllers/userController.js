import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;

    const query = q.trim()
      ? {
          $or: [
            { name: { $regex: q.trim(), $options: 'i' } },
            { email: { $regex: q.trim(), $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select('name email avatar status bio')
      .limit(parseInt(limit, 10));

    return ApiResponse.success(res, { users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar status bio createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};


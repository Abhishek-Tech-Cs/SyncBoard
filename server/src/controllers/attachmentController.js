import { Attachment } from '../models/Attachment.js';
import { Task } from '../models/Task.js';
import { StorageService } from '../config/storage.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const { projectId, taskId } = req.body;
    const fileData = await StorageService.processUpload(req.file);

    const attachment = await Attachment.create({
      workspace: req.workspace._id,
      project: projectId || null,
      task: taskId || null,
      uploader: req.user._id,
      ...fileData,
    });

    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        $push: { attachments: attachment._id },
      });
    }

    const populated = await Attachment.findById(attachment._id).populate('uploader', 'name email avatar');

    return ApiResponse.created(res, { attachment: populated }, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findOne({
      _id: id,
      workspace: req.workspace._id,
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    if (String(attachment.uploader) !== String(req.user._id) && req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
      throw ApiError.forbidden('Permission denied');
    }

    await StorageService.deleteFile(attachment.filePath, attachment.publicId, attachment.provider);

    if (attachment.task) {
      await Task.findByIdAndUpdate(attachment.task, {
        $pull: { attachments: attachment._id },
      });
    }

    await Attachment.findByIdAndDelete(id);

    return ApiResponse.success(res, null, 'Attachment deleted successfully');
  } catch (error) {
    next(error);
  }
};


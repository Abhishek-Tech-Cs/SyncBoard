import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Channel name cannot exceed 50 characters'],
    },
    topic: {
      type: String,
      default: '',
      maxlength: [200, 'Channel topic cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['public', 'private', 'direct'],
      default: 'public',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

channelSchema.index({ workspace: 1, name: 1 });
channelSchema.index({ workspace: 1, type: 1 });

export const Channel = mongoose.model('Channel', channelSchema);


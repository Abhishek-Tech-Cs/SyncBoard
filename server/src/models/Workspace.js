import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logo: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      defaultChannelName: {
        type: String,
        default: 'general',
      },
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.index({ owner: 1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);

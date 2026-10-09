import mongoose from 'mongoose';

export const TASK_STATUSES = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const taskSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    taskNumber: {
      type: Number,
      required: true,
    },
    taskKey: {
      type: String,
      required: true, // e.g. "PRJ-12"
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'Todo',
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'MEDIUM',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    checklist: [checklistItemSchema],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    estimatedHours: {
      type: Number,
      default: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ assignees: 1 });

// Automatically update completedAt when status changes to 'Done'
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'Done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Done') {
      this.completedAt = null;
    }
  }
  next();
});

export const Task = mongoose.model('Task', taskSchema);


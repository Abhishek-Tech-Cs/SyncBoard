import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(Object.values(ROLES)).default(ROLES.MEMBER),
  }),
});

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
    key: z.string().min(2).max(10).toUpperCase(),
    description: z.string().max(1000).optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('IN_PROGRESS'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    labels: z.array(z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })).optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().optional().default(''),
    status: z.enum(['Backlog', 'Todo', 'In Progress', 'Review', 'Done']).default('Todo'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    assignees: z.array(z.string()).optional().default([]),
    dueDate: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    labels: z.array(z.string()).optional().default([]),
    estimatedHours: z.number().optional().default(0),
  }),
});

export const moveTaskSchema = z.object({
  body: z.object({
    status: z.enum(['Backlog', 'Todo', 'In Progress', 'Review', 'Done']),
    order: z.number().min(0),
  }),
});


import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMember } from '../src/models/WorkspaceMember.js';
import { Project } from '../src/models/Project.js';
import { Task } from '../src/models/Task.js';

describe('SyncBoard API Test Suite', () => {
  let user1Token;
  let user2Token;
  let user1Id;
  let user2Id;
  let workspace1Id;
  let workspace2Id;
  let projectId;
  let taskId;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $in: ['testowner@syncboard.dev', 'usertwo@syncboard.dev'] } });
    await Workspace.deleteMany({ name: { $in: ['Workspace Alpha', 'Workspace Beta'] } });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Authentication Flow', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Owner',
          email: 'testowner@syncboard.dev',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testowner@syncboard.dev');
      expect(res.body.data.token).toBeDefined();

      user1Token = res.body.data.token;
      user1Id = res.body.data.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'testowner@syncboard.dev',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testowner@syncboard.dev',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should register a second user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Two',
          email: 'usertwo@syncboard.dev',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      user2Token = res.body.data.token;
      user2Id = res.body.data.user.id;
    });
  });

  describe('2. Workspace Creation & Isolation', () => {
    it('User 1 should create Workspace A', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Workspace Alpha',
          description: 'First secure workspace',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.workspace.name).toBe('Workspace Alpha');
      workspace1Id = res.body.data.workspace._id;
    });

    it('User 2 should create Workspace B', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Workspace Beta',
          description: 'Second separate workspace',
        });

      expect(res.status).toBe(201);
      workspace2Id = res.body.data.workspace._id;
    });

    it('STRICT TENANCY: User 2 must NOT be able to access Workspace A', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set('x-workspace-id', workspace1Id);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('User 1 can access Workspace A', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id);

      expect(res.status).toBe(200);
      expect(res.body.data.workspace.name).toBe('Workspace Alpha');
      expect(res.body.data.role).toBe('OWNER');
    });
  });

  describe('3. Project Management', () => {
    it('should create a project in Workspace A', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id)
        .send({
          name: 'SyncBoard Backend',
          key: 'SBB',
          description: 'Node.js Express backend API',
          priority: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.project.key).toBe('SBB');
      projectId = res.body.data.project._id;
    });

    it('should get projects for Workspace A', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id);

      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Task CRUD & Drag-and-Drop Kanban Movement', () => {
    it('should create a task in the project', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id)
        .send({
          projectId,
          title: 'Setup Redis Caching',
          description: 'Implement Redis cache for dashboard analytics',
          status: 'Todo',
          priority: 'URGENT',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe('Setup Redis Caching');
      expect(res.body.data.task.taskKey).toBe('SBB-1');
      taskId = res.body.data.task._id;
    });

    it('should move the task from Todo -> In Progress (Kanban Drag)', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id)
        .send({
          status: 'In Progress',
          order: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('In Progress');
    });

    it('should add a checklist item to the task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/checklist`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id)
        .send({
          text: 'Verify Redis connection fallback',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.checklist.length).toBe(1);
      expect(res.body.data.checklist[0].text).toBe('Verify Redis connection fallback');
    });

    it('should add a comment to the task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id)
        .send({
          content: 'Working on this now. Fallback is configured nicely.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe('Working on this now. Fallback is configured nicely.');
    });
  });

  describe('5. Workspace Dashboard & Analytics', () => {
    it('should retrieve workspace dashboard stats', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace1Id}/dashboard`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id);

      expect(res.status).toBe(200);
      expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
      expect(res.body.data.projectCount).toBeGreaterThanOrEqual(1);
    });

    it('should retrieve analytics with aggregation pipelines', async () => {
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('x-workspace-id', workspace1Id);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.tasksByStatus).toBeDefined();
      expect(res.body.data.tasksByPriority).toBeDefined();
    });
  });
});


import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMember } from '../src/models/WorkspaceMember.js';
import { Project } from '../src/models/Project.js';
import { ProjectMember } from '../src/models/ProjectMember.js';
import { Task, TASK_STATUSES } from '../src/models/Task.js';
import { Comment } from '../src/models/Comment.js';
import { Channel } from '../src/models/Channel.js';
import { Message } from '../src/models/Message.js';
import { Notification } from '../src/models/Notification.js';
import { ActivityLog } from '../src/models/ActivityLog.js';
import { ROLES } from '../src/constants/roles.js';

const seedDatabase = async () => {
  try {
    console.log('--- Starting SyncBoard Database Seeder ---');
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMember.deleteMany({}),
      Project.deleteMany({}),
      ProjectMember.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Channel.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    console.log('Seeding 10 Users...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const userData = [
      { name: 'Alex Rivera', email: 'alex@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', bio: 'Full-Stack Lead & Platform Architect' },
      { name: 'Samantha Chen', email: 'samantha@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', bio: 'Senior Product Manager & Agile Coach' },
      { name: 'David Kim', email: 'david@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'Frontend Specialist (React, Tailwind, Performance)' },
      { name: 'Maria Garcia', email: 'maria@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', bio: 'DevOps & Distributed Systems Engineer' },
      { name: 'James Wilson', email: 'james@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', bio: 'Product Designer & Design Systems Lead' },
      { name: 'Priya Sharma', email: 'priya@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150', bio: 'QA Automation Engineer & SDET' },
      { name: 'Liam Johnson', email: 'liam@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', bio: 'Senior Backend Engineer (Node.js & MongoDB)' },
      { name: 'Emma Watson', email: 'emma@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', bio: 'Data Analyst & Metrics Specialist' },
      { name: 'Lucas Miller', email: 'lucas@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', bio: 'Junior Software Engineer' },
      { name: 'Sophia Taylor', email: 'sophia@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', bio: 'Executive Stakeholder & Project Observer' },
    ];

    const users = await User.insertMany(
      userData.map((u) => ({
        ...u,
        password: hashedPassword,
        isVerified: true,
        status: 'online',
      }))
    );
    console.log(`✓ Created ${users.length} users (Password: Password123!)`);

    const [alex, samantha, david, maria, james, priya, liam, emma, lucas, sophia] = users;

    console.log('Seeding 3 Workspaces...');
    const workspaces = await Workspace.insertMany([
      {
        name: 'Acme Corp Engineering',
        slug: 'acme-engineering',
        description: 'Core product engineering organization handling primary SaaS platform services.',
        owner: alex._id,
        settings: { allowMemberInvites: true, defaultChannelName: 'general' },
      },
      {
        name: 'FinTech Cloud Solutions',
        slug: 'fintech-cloud',
        description: 'High-compliance financial technology infrastructure and payment pipelines.',
        owner: samantha._id,
        settings: { allowMemberInvites: true, defaultChannelName: 'general' },
      },
      {
        name: 'NextGen AI Labs',
        slug: 'nextgen-ai-labs',
        description: 'Experimental generative AI models, vector stores, and intelligent agents.',
        owner: maria._id,
        settings: { allowMemberInvites: true, defaultChannelName: 'general' },
      },
    ]);
    console.log(`✓ Created ${workspaces.length} workspaces`);

    const [wsAcme, wsFinTech, wsAi] = workspaces;

    console.log('Seeding Workspace Members with RBAC roles...');
    // Acme Members
    await WorkspaceMember.insertMany([
      { workspace: wsAcme._id, user: alex._id, role: ROLES.OWNER },
      { workspace: wsAcme._id, user: samantha._id, role: ROLES.ADMIN },
      { workspace: wsAcme._id, user: maria._id, role: ROLES.ADMIN },
      { workspace: wsAcme._id, user: david._id, role: ROLES.MANAGER },
      { workspace: wsAcme._id, user: james._id, role: ROLES.MEMBER },
      { workspace: wsAcme._id, user: priya._id, role: ROLES.MEMBER },
      { workspace: wsAcme._id, user: liam._id, role: ROLES.MEMBER },
      { workspace: wsAcme._id, user: emma._id, role: ROLES.MEMBER },
      { workspace: wsAcme._id, user: lucas._id, role: ROLES.MEMBER },
      { workspace: wsAcme._id, user: sophia._id, role: ROLES.VIEWER },
      // FinTech Members
      { workspace: wsFinTech._id, user: samantha._id, role: ROLES.OWNER },
      { workspace: wsFinTech._id, user: alex._id, role: ROLES.ADMIN },
      { workspace: wsFinTech._id, user: maria._id, role: ROLES.MANAGER },
      { workspace: wsFinTech._id, user: liam._id, role: ROLES.MEMBER },
      { workspace: wsFinTech._id, user: priya._id, role: ROLES.MEMBER },
      { workspace: wsFinTech._id, user: sophia._id, role: ROLES.VIEWER },
      // AI Labs Members
      { workspace: wsAi._id, user: maria._id, role: ROLES.OWNER },
      { workspace: wsAi._id, user: alex._id, role: ROLES.ADMIN },
      { workspace: wsAi._id, user: david._id, role: ROLES.MEMBER },
      { workspace: wsAi._id, user: lucas._id, role: ROLES.MEMBER },
      { workspace: wsAi._id, user: emma._id, role: ROLES.MEMBER },
    ]);
    console.log('✓ Created Workspace Memberships');

    console.log('Seeding 8 Projects...');
    const projectTemplates = [
      // Acme Projects
      { workspace: wsAcme._id, name: 'SyncBoard Web Platform', key: 'SYNC', description: 'Core web application including Kanban, real-time collaboration, and analytics.', status: 'IN_PROGRESS', priority: 'HIGH', createdBy: alex._id },
      { workspace: wsAcme._id, name: 'Real-Time WebSocket Engine', key: 'WS', description: 'Socket.io multi-room gateway with Redis pub/sub adapter.', status: 'IN_PROGRESS', priority: 'URGENT', createdBy: maria._id },
      { workspace: wsAcme._id, name: 'Mobile App React Native', key: 'MOB', description: 'Cross-platform iOS and Android companion app.', status: 'PLANNING', priority: 'MEDIUM', createdBy: david._id },
      { workspace: wsAcme._id, name: 'Design System & UI Components', key: 'UI', description: 'Reusable Tailwind & Radix design tokens and accessible component library.', status: 'COMPLETED', priority: 'LOW', createdBy: james._id },
      // FinTech Projects
      { workspace: wsFinTech._id, name: 'PCI-DSS Payment Gateway v3', key: 'PAY', description: 'Zero-downtime card processing and automated reconciliation pipelines.', status: 'IN_PROGRESS', priority: 'URGENT', createdBy: samantha._id },
      { workspace: wsFinTech._id, name: 'Real-Time Fraud Detection', key: 'FRD', description: 'Machine learning rule engine analyzing suspicious transaction spikes.', status: 'IN_PROGRESS', priority: 'HIGH', createdBy: liam._id },
      // AI Labs Projects
      { workspace: wsAi._id, name: 'Autonomous LLM Agent Swarm', key: 'AGT', description: 'Multi-agent orchestration platform for automated code review and testing.', status: 'IN_PROGRESS', priority: 'HIGH', createdBy: maria._id },
      { workspace: wsAi._id, name: 'Computer Vision Defect Analysis', key: 'VIS', description: 'Edge-deployed object recognition and edge telemetry analysis.', status: 'PLANNING', priority: 'MEDIUM', createdBy: alex._id },
    ];

    const projects = await Project.insertMany(projectTemplates);
    console.log(`✓ Created ${projects.length} projects`);

    // Assign project members
    for (const p of projects) {
      await ProjectMember.create({
        project: p._id,
        workspace: p.workspace,
        user: p.createdBy,
        role: 'LEAD',
      });
      // Add other relevant users
      const randomUsers = users.slice(0, 5);
      for (const u of randomUsers) {
        if (String(u._id) !== String(p.createdBy)) {
          await ProjectMember.create({
            project: p._id,
            workspace: p.workspace,
            user: u._id,
            role: 'MEMBER',
          });
        }
      }
    }

    console.log('Seeding 100+ Tasks across Projects...');
    const taskTitles = [
      'Design token system in Tailwind CSS', 'Implement JWT token refresh mechanism', 'Configure Redis cluster for session cache',
      'Optimize Kanban drag-and-drop re-rendering', 'Add MongoDB compound indexes for task queries', 'Build calendar month/week view toggle',
      'Implement typing indicators in team chat', 'Write integration tests for workspace RBAC', 'Configure Docker Compose multi-stage build',
      'Create task checklist progress calculation', 'Set up Prometheus metrics exporter', 'Add file size limit validator on upload',
      'Implement real-time task movement broadcast', 'Support user @mentions in comments', 'Build project analytics charts in Recharts',
      'Implement global fuzzy search across workspaces', 'Add rate limiter on authentication endpoints', 'Build user presence heartbeat tracking',
      'Implement workspace invite acceptance flow', 'Create automated database backup script', 'Design dark mode color scheme tokens',
      'Configure helmet security headers', 'Optimize asset bundle size with Vite chunks', 'Build responsive mobile drawer navigation',
      'Implement unread notification count badge', 'Audit OWASP top 10 security vulnerabilities', 'Create seed data script with 100+ tasks',
      'Implement password reset email via Nodemailer', 'Build task priority badge component', 'Support Markdown rendering in descriptions',
      'Implement channel message editing and deletion', 'Add virtualized list for long chat feeds', 'Set up GitHub Actions CI workflow for tests',
      'Implement activity log audit trail for tasks', 'Build task due-date reminder cron job', 'Create project progress percentage bar',
      'Implement workspace deletion safeguard modal', 'Optimize MongoDB aggregate pipeline for stats', 'Build direct messaging 1-on-1 channels',
      'Add multi-file drag-and-drop attachment upload', 'Support export board to CSV/JSON format', 'Implement toast notifications with auto-dismiss',
      'Refactor state management with React Query v5', 'Add skeleton loading states for Kanban cards', 'Implement custom 404 and Error Boundary',
      'Add health check endpoint for container probes', 'Implement role change instant socket sync', 'Configure SSL termination in Nginx reverse proxy',
      'Implement infinite scrolling for activity logs', 'Build user profile avatar image upload'
    ];

    const taskDocs = [];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const sampleLabels = ['Backend', 'Frontend', 'Security', 'Database', 'DevOps', 'UI/UX', 'Testing'];

    let globalTaskCounter = 1;

    for (const project of projects) {
      const taskCountForProject = project.key === 'SYNC' ? 35 : project.key === 'WS' ? 20 : 12;

      for (let i = 0; i < taskCountForProject; i++) {
        const title = taskTitles[(i + globalTaskCounter) % taskTitles.length] + ` (#${globalTaskCounter})`;
        const status = TASK_STATUSES[i % TASK_STATUSES.length];
        const priority = priorities[(i + globalTaskCounter) % priorities.length];
        const assignee = users[(i + globalTaskCounter) % users.length];
        const reporter = users[(i * 3) % users.length];

        const daysOffset = (i % 20) - 5;
        const dueDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
        const startDate = new Date(Date.now() - (10 - (i % 5)) * 24 * 60 * 60 * 1000);

        taskDocs.push({
          workspace: project.workspace,
          project: project._id,
          taskNumber: i + 1,
          taskKey: `${project.key}-${i + 1}`,
          title,
          description: `Comprehensive technical task for ${project.name}. Ensure full test coverage, robust edge case handling, and seamless integration with existing services.`,
          status,
          priority,
          order: i,
          assignees: [assignee._id],
          reporter: reporter._id,
          dueDate,
          startDate,
          labels: [sampleLabels[i % sampleLabels.length], sampleLabels[(i + 2) % sampleLabels.length]],
          checklist: [
            { text: 'Analyze technical requirements and dependencies', completed: true, completedAt: new Date() },
            { text: 'Implement backend API route and controller logic', completed: status === 'Done' || status === 'Review' },
            { text: 'Add unit and integration tests with edge cases', completed: status === 'Done' },
            { text: 'Verify real-time event propagation via Socket.io', completed: status === 'Done' },
          ],
          estimatedHours: 4 + (i % 8) * 2,
          actualHours: status === 'Done' ? 5 + (i % 6) * 2 : 2,
          completedAt: status === 'Done' ? new Date() : null,
          createdAt: new Date(Date.now() - (15 - (i % 10)) * 24 * 60 * 60 * 1000),
        });

        globalTaskCounter++;
      }

      await Project.findByIdAndUpdate(project._id, { taskCounter: taskCountForProject });
    }

    const tasks = await Task.insertMany(taskDocs);
    console.log(`✓ Created ${tasks.length} tasks across 8 projects`);

    console.log('Seeding 50+ Task Comments...');
    const commentTexts = [
      'Reviewed the pull request. Clean architectural separation between controller and service layer!',
      'Can we add a composite index on this MongoDB collection to prevent slow table scans?',
      'Tested this locally on Chrome and Firefox. WebSocket reconnection works smoothly without data loss.',
      'Added the required checklist items. Assigning to QA for final validation.',
      'Verified performance under 200 concurrent simulated socket connections. Response latency is under 15ms.',
      'Please check the edge case when the authentication token expires mid-session.',
      'Updated the design specs based on feedback from the sprint retrospective.',
      'The Redis cache invalidation hook is triggering properly on all task move actions now.',
      'Ready for deployment! All Docker health checks are green.',
      'Great work! Moving this ticket to Done.'
    ];

    const commentDocs = [];
    for (let i = 0; i < 55; i++) {
      const task = tasks[i % tasks.length];
      const author = users[i % users.length];
      const text = commentTexts[i % commentTexts.length];

      commentDocs.push({
        workspace: task.workspace,
        project: task.project,
        task: task._id,
        author: author._id,
        content: text,
        mentions: i % 3 === 0 ? [users[(i + 1) % users.length]._id] : [],
        createdAt: new Date(Date.now() - (10 - (i % 7)) * 24 * 60 * 60 * 1000),
      });
    }

    const comments = await Comment.insertMany(commentDocs);
    console.log(`✓ Created ${comments.length} task comments`);

    console.log('Seeding Channels & 100+ Chat Messages...');
    const channels = await Channel.insertMany([
      { workspace: wsAcme._id, name: 'general', topic: 'Company-wide updates and welcome messages', type: 'public', createdBy: alex._id, members: users.map(u => u._id) },
      { workspace: wsAcme._id, name: 'dev-team', topic: 'Core engineering discussions, PR reviews, architecture', type: 'public', createdBy: alex._id, members: users.map(u => u._id) },
      { workspace: wsAcme._id, name: 'releases', topic: 'Automated CI/CD releases and deployment changelogs', type: 'public', createdBy: maria._id, members: users.map(u => u._id) },
      { workspace: wsFinTech._id, name: 'general', topic: 'Fintech compliance and infrastructure chatter', type: 'public', createdBy: samantha._id, members: [samantha._id, alex._id, maria._id, liam._id, priya._id] },
      { workspace: wsFinTech._id, name: 'security-audit', topic: 'Audits and vulnerability tracking', type: 'private', createdBy: samantha._id, members: [samantha._id, alex._id, maria._id] },
      { workspace: wsAi._id, name: 'general', topic: 'AI research, experiments, paper readings', type: 'public', createdBy: maria._id, members: [maria._id, alex._id, david._id, lucas._id, emma._id] },
    ]);

    const chatSnippets = [
      'Morning everyone! The sprint 14 deployment is live on staging.',
      'Remember to pull latest main before starting work on the Kanban real-time listener.',
      'Just merged the Redis caching middleware PR. Project dashboard queries dropped from 120ms to 4ms!',
      'Socket.io rooms are properly partitioned by workspaceId and projectId now.',
      'Has anyone verified the Docker Compose setup on a fresh machine?',
      'Yes, works out of the box with `docker compose up --build`.',
      'Great job on the task card drag-and-drop animation! Feels very responsive.',
      'Added the Zod validation schemas for all task mutation endpoints.',
      'Please ensure you run `npm run test` before opening PRs.',
      'Reminder: Team retro is scheduled for 4 PM today.',
      'The Recharts productivity trend chart now updates in real time when tasks are completed!',
      'Awesome work team. All 100+ test fixtures are passing.'
    ];

    const messageDocs = [];
    const devChannel = channels[1]; // #dev-team
    const generalChannel = channels[0]; // #general

    for (let i = 0; i < 110; i++) {
      const channel = i % 3 === 0 ? generalChannel : devChannel;
      const sender = users[i % users.length];
      const content = chatSnippets[i % chatSnippets.length] + (i % 5 === 0 ? ` [Ref #${i}]` : '');

      messageDocs.push({
        channel: channel._id,
        workspace: wsAcme._id,
        sender: sender._id,
        content,
        mentions: i % 4 === 0 ? [users[(i + 2) % users.length]._id] : [],
        readBy: [sender._id],
        createdAt: new Date(Date.now() - (120 - i) * 60 * 60 * 1000),
      });
    }

    const messages = await Message.insertMany(messageDocs);
    console.log(`✓ Created ${messages.length} chat messages across workspace channels`);

    console.log('Seeding Notifications & Activity Logs...');
    const notifications = [];
    for (let i = 0; i < 25; i++) {
      const recipient = users[i % users.length];
      const sender = users[(i + 1) % users.length];
      const task = tasks[i % tasks.length];

      notifications.push({
        recipient: recipient._id,
        sender: sender._id,
        workspace: wsAcme._id,
        type: i % 2 === 0 ? 'TASK_ASSIGNED' : 'COMMENT_ADDED',
        title: i % 2 === 0 ? 'Assigned to New Task' : 'New Comment Mention',
        message: i % 2 === 0 ? `${sender.name} assigned you to ${task.title}` : `${sender.name} commented on ${task.title}`,
        link: `/projects/${task.project}?task=${task._id}`,
        read: i > 15,
        createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000),
      });
    }
    await Notification.insertMany(notifications);
    console.log(`✓ Created ${notifications.length} notifications`);

    const activityDocs = [];
    for (let i = 0; i < 40; i++) {
      const task = tasks[i % tasks.length];
      const actor = users[i % users.length];

      activityDocs.push({
        workspace: task.workspace,
        project: task.project,
        task: task._id,
        actor: actor._id,
        action: i % 3 === 0 ? 'TASK_MOVED' : i % 2 === 0 ? 'TASK_CREATED' : 'COMMENT_ADDED',
        entityType: 'TASK',
        entityId: task._id,
        details: {
          taskTitle: task.title,
          from: 'Todo',
          to: task.status,
        },
        createdAt: new Date(Date.now() - (40 - i) * 2 * 60 * 60 * 1000),
      });
    }
    await ActivityLog.insertMany(activityDocs);
    console.log(`✓ Created ${activityDocs.length} activity audit log records`);

    console.log('==================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Demo Login Accounts:');
    console.log(' 1. alex@syncboard.dev     / Password123! (Owner - Acme Corp)');
    console.log(' 2. samantha@syncboard.dev / Password123! (Admin/Owner - FinTech)');
    console.log(' 3. maria@syncboard.dev    / Password123! (Admin/Owner - NextGen AI)');
    console.log(' 4. david@syncboard.dev    / Password123! (Manager - Frontend)');
    console.log(' 5. sophia@syncboard.dev   / Password123! (Viewer - Stakeholder)');
    console.log('==================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();


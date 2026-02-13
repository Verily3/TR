/**
 * Database seed script
 * Creates initial data for development and testing
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { hash } from 'argon2';
import * as schema from './schema/index.js';
import { SYSTEM_ROLES, type SystemRoleDefinition } from '@tr/shared';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Wrap entire seed in a transaction for atomicity
  // If any operation fails, all changes are rolled back
  await db.transaction(async (tx) => {
    await seedData(tx);
  });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Test accounts (password: password123):');
  console.log('  - Agency Admin: admin@acme.com');
  console.log('  - Tenant Admin: admin@techcorp.com');
  console.log('  - Facilitator:  coach@techcorp.com');
  console.log('  - Mentor:       mentor@techcorp.com');
  console.log('  - Learners:     john.doe@techcorp.com, jane.smith@techcorp.com, alex.wilson@techcorp.com\n');

  await client.end();
  process.exit(0);
}

async function seedData(db: any) {
  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await db.delete(schema.assessmentResponses);
  await db.delete(schema.assessmentInvitations);
  await db.delete(schema.assessments);
  await db.delete(schema.assessmentBenchmarks);
  await db.delete(schema.assessmentTemplates);
  await db.delete(schema.lessonDiscussions);
  await db.delete(schema.enrollmentMentorships);
  await db.delete(schema.lessonProgress);
  await db.delete(schema.goalReviews);
  await db.delete(schema.goalResponses);
  await db.delete(schema.approvalSubmissions);
  await db.delete(schema.enrollments);
  await db.delete(schema.lessons);
  await db.delete(schema.modules);
  await db.delete(schema.programs);
  await db.delete(schema.impersonationSessions);
  await db.delete(schema.sessions);
  await db.delete(schema.userRoles);
  await db.delete(schema.roles);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
  await db.delete(schema.agencies);
  console.log('  ✓ Cleared existing data\n');

  // Hash password for all test users
  const passwordHash = await hash('password123');

  // 1. Create Agency
  console.log('Creating agency...');
  const [agency] = await db
    .insert(schema.agencies)
    .values({
      name: 'Acme Consulting',
      slug: 'acme',
      domain: 'acme.com',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      settings: {
        allowClientProgramCreation: false,
        maxClients: 50,
        maxUsersPerClient: 100,
        features: {
          programs: true,
          assessments: true,
          mentoring: true,
          goals: true,
          analytics: true,
        },
      },
    })
    .returning();
  console.log(`  ✓ Agency created: ${agency.name} (${agency.id})`);

  // 2. Create System Roles for Agency
  console.log('\nCreating agency roles...');
  const agencyRoles: Record<string, typeof schema.roles.$inferSelect> = {};

  for (const [key, roleDef] of Object.entries(SYSTEM_ROLES) as [string, SystemRoleDefinition][]) {
    if (roleDef.isAgencyRole) {
      const [role] = await db
        .insert(schema.roles)
        .values({
          agencyId: agency.id,
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          level: roleDef.level,
          isSystem: true,
          permissions: roleDef.permissions,
        })
        .returning();
      agencyRoles[key] = role;
      console.log(`  ✓ Role created: ${role.name}`);
    }
  }

  // 3. Create Agency Admin User
  console.log('\nCreating agency admin user...');
  const [agencyAdmin] = await db
    .insert(schema.users)
    .values({
      agencyId: agency.id,
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'Agency',
      lastName: 'Admin',
      title: 'Managing Director',
      status: 'active',
      emailVerified: true,
    })
    .returning();
  console.log(`  ✓ User created: ${agencyAdmin.email}`);

  // Assign agency owner role
  await db.insert(schema.userRoles).values({
    userId: agencyAdmin.id,
    roleId: agencyRoles.AGENCY_OWNER.id,
  });
  console.log(`  ✓ Assigned role: Agency Owner`);

  // 4. Create Tenant (Client)
  console.log('\nCreating tenant...');
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      agencyId: agency.id,
      name: 'TechCorp Industries',
      slug: 'techcorp',
      domain: 'techcorp.com',
      industry: 'Technology',
      status: 'active',
      usersLimit: 100,
      settings: {
        timezone: 'America/New_York',
        canCreatePrograms: false,
        features: {
          programs: true,
          assessments: true,
          mentoring: true,
          goals: true,
          analytics: true,
          scorecard: true,
          planning: true,
        },
      },
    })
    .returning();
  console.log(`  ✓ Tenant created: ${tenant.name} (${tenant.id})`);

  // 5. Create Tenant Roles
  console.log('\nCreating tenant roles...');
  const tenantRoles: Record<string, typeof schema.roles.$inferSelect> = {};

  for (const [key, roleDef] of Object.entries(SYSTEM_ROLES) as [string, SystemRoleDefinition][]) {
    if (!roleDef.isAgencyRole) {
      const [role] = await db
        .insert(schema.roles)
        .values({
          tenantId: tenant.id,
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          level: roleDef.level,
          isSystem: true,
          permissions: roleDef.permissions,
        })
        .returning();
      tenantRoles[key] = role;
      console.log(`  ✓ Role created: ${role.name}`);
    }
  }

  // 6. Create Tenant Admin
  console.log('\nCreating tenant admin...');
  const [tenantAdmin] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'admin@techcorp.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      title: 'HR Director',
      department: 'Human Resources',
      status: 'active',
      emailVerified: true,
    })
    .returning();
  console.log(`  ✓ User created: ${tenantAdmin.email}`);

  await db.insert(schema.userRoles).values({
    userId: tenantAdmin.id,
    roleId: tenantRoles.TENANT_ADMIN.id,
  });
  console.log(`  ✓ Assigned role: Client Admin`);

  // 7. Create Facilitator
  console.log('\nCreating facilitator...');
  const [facilitator] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'coach@techcorp.com',
      passwordHash,
      firstName: 'Michael',
      lastName: 'Chen',
      title: 'Leadership Coach',
      department: 'Learning & Development',
      status: 'active',
      emailVerified: true,
    })
    .returning();
  console.log(`  ✓ User created: ${facilitator.email}`);

  await db.insert(schema.userRoles).values({
    userId: facilitator.id,
    roleId: tenantRoles.FACILITATOR.id,
  });
  console.log(`  ✓ Assigned role: Facilitator`);

  // 8. Create Mentor
  console.log('\nCreating mentor...');
  const [mentor] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'mentor@techcorp.com',
      passwordHash,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      title: 'Senior Manager',
      department: 'Operations',
      status: 'active',
      emailVerified: true,
    })
    .returning();
  console.log(`  ✓ User created: ${mentor.email}`);

  await db.insert(schema.userRoles).values({
    userId: mentor.id,
    roleId: tenantRoles.MENTOR.id,
  });
  console.log(`  ✓ Assigned role: Mentor`);

  // 9. Create Learners
  console.log('\nCreating learners...');
  const learnerData = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@techcorp.com' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@techcorp.com' },
    { firstName: 'Alex', lastName: 'Wilson', email: 'alex.wilson@techcorp.com' },
  ];

  const learners: (typeof schema.users.$inferSelect)[] = [];
  for (const data of learnerData) {
    const [learner] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        title: 'Team Lead',
        department: 'Engineering',
        managerId: mentor.id,
        status: 'active',
        emailVerified: true,
      })
      .returning();
    learners.push(learner);
    console.log(`  ✓ User created: ${learner.email}`);

    await db.insert(schema.userRoles).values({
      userId: learner.id,
      roleId: tenantRoles.LEARNER.id,
    });
    console.log(`  ✓ Assigned role: Learner`);
  }

  // 10. Create Programs
  console.log('\nCreating programs...');

  // Program 1: Leadership Essentials (Cohort)
  const [program1] = await db
    .insert(schema.programs)
    .values({
      tenantId: tenant.id,
      agencyId: agency.id,
      name: 'Leadership Essentials',
      internalName: 'LE-2026-Q1',
      description: 'A comprehensive leadership development program designed to build core leadership competencies.',
      type: 'cohort',
      status: 'active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30'),
      timezone: 'America/New_York',
      config: {
        sequentialAccess: true,
        trackInScorecard: true,
        issueCertificate: true,
      },
      createdBy: facilitator.id,
    })
    .returning();
  console.log(`  ✓ Program created: ${program1.name}`);

  // Create modules for Program 1
  const [module1_1] = await db
    .insert(schema.modules)
    .values({
      programId: program1.id,
      title: 'Module 1: Self-Awareness',
      description: 'Understand your leadership style and strengths',
      order: 0,
      depth: 0,
      dripType: 'immediate',
      status: 'active',
    })
    .returning();

  const [module1_2] = await db
    .insert(schema.modules)
    .values({
      programId: program1.id,
      title: 'Module 2: Communication',
      description: 'Master effective communication techniques',
      order: 1,
      depth: 0,
      dripType: 'days_after_previous',
      dripValue: 7,
      status: 'active',
    })
    .returning();

  const [module1_3] = await db
    .insert(schema.modules)
    .values({
      programId: program1.id,
      title: 'Module 3: Team Building',
      description: 'Build and lead high-performing teams',
      order: 2,
      depth: 0,
      dripType: 'days_after_previous',
      dripValue: 7,
      status: 'active',
    })
    .returning();
  console.log(`  ✓ Created 3 modules for ${program1.name}`);

  // Create lessons for Module 1
  const module1Lessons = await db.insert(schema.lessons).values([
    {
      moduleId: module1_1.id,
      title: 'Introduction to Leadership',
      contentType: 'lesson',
      order: 0,
      durationMinutes: 30,
      points: 10,
      content: {
        introduction: 'Welcome to Leadership Essentials!',
        mainContent: '<p>In this lesson, we explore what it means to be an effective leader...</p>',
        keyTakeaway: 'Leadership is about influence, not authority.',
      },
      dripType: 'immediate',
      status: 'active',
    },
    {
      moduleId: module1_1.id,
      title: 'Leadership Style Assessment',
      contentType: 'assignment',
      order: 1,
      durationMinutes: 45,
      points: 20,
      content: {
        instructions: 'Complete the leadership style assessment and reflect on your results.',
        questions: [
          'What leadership style do you most identify with?',
          'How does your style impact your team?',
        ],
      },
      dripType: 'sequential',
      status: 'active',
    },
    {
      moduleId: module1_1.id,
      title: 'Set Your Leadership Goal',
      contentType: 'goal',
      order: 2,
      durationMinutes: 20,
      points: 15,
      content: {
        goalPrompt: 'Based on your assessment, set a goal for developing your leadership skills.',
        requireMetrics: true,
        requireActionSteps: true,
      },
      dripType: 'sequential',
      status: 'active',
    },
    {
      moduleId: module1_1.id,
      title: 'Mentor Check-in: Self-Awareness',
      contentType: 'mentor_meeting',
      order: 3,
      durationMinutes: 30,
      points: 10,
      content: {
        agenda: 'Discuss your self-awareness insights with your mentor.',
        discussionQuestions: ['What surprised you about your self-assessment?', 'What areas do you want to develop?'],
      },
      approvalRequired: 'mentor',
      dripType: 'sequential',
      status: 'active',
    },
  ]).returning();
  console.log(`  ✓ Created 4 lessons for Module 1`);

  // Create lessons for Module 2
  const module2Lessons = await db.insert(schema.lessons).values([
    {
      moduleId: module1_2.id,
      title: 'Active Listening',
      contentType: 'lesson',
      order: 0,
      durationMinutes: 25,
      points: 10,
      content: {
        introduction: 'The foundation of great communication.',
        videoUrl: 'https://example.com/videos/active-listening.mp4',
        keyConcepts: [
          { title: 'Focus', description: 'Give your full attention' },
          { title: 'Reflect', description: 'Mirror back what you hear' },
        ],
      },
      dripType: 'immediate',
      status: 'active',
    },
    {
      moduleId: module1_2.id,
      title: 'Giving Feedback',
      contentType: 'lesson',
      order: 1,
      durationMinutes: 30,
      points: 10,
      content: {
        introduction: 'Learn the art of constructive feedback.',
        reflectionPrompts: ['How do you typically give feedback?'],
      },
      dripType: 'sequential',
      status: 'active',
    },
    {
      moduleId: module1_2.id,
      title: 'Communication Reflection',
      contentType: 'text_form',
      order: 2,
      durationMinutes: 15,
      points: 10,
      content: {
        formPrompt: 'Describe a recent communication challenge and how you addressed it.',
        minLength: 100,
      },
      dripType: 'sequential',
      status: 'active',
    },
  ]).returning();
  console.log(`  ✓ Created 3 lessons for Module 2`);

  // Create lessons for Module 3
  const _module3Lessons = await db.insert(schema.lessons).values([
    {
      moduleId: module1_3.id,
      title: 'Team Dynamics',
      contentType: 'lesson',
      order: 0,
      durationMinutes: 35,
      points: 15,
      content: {
        introduction: 'Understanding how teams form and function.',
      },
      dripType: 'immediate',
      status: 'active',
    },
    {
      moduleId: module1_3.id,
      title: 'Mentor Meeting: Team Strategy',
      contentType: 'mentor_meeting',
      order: 1,
      durationMinutes: 45,
      points: 20,
      content: {
        agenda: 'Discuss your team building strategy',
        discussionQuestions: [
          'What are your team\'s strengths?',
          'What challenges are you facing?',
        ],
      },
      dripType: 'sequential',
      status: 'active',
    },
    {
      moduleId: module1_3.id,
      title: 'Program Completion Review',
      contentType: 'text_form',
      order: 2,
      durationMinutes: 10,
      points: 25,
      content: {
        formPrompt: 'Write a final reflection on your leadership journey and key takeaways from the program.',
        minLength: 200,
      },
      approvalRequired: 'facilitator',
      dripType: 'sequential',
      status: 'active',
    },
  ]).returning();
  console.log(`  ✓ Created 3 lessons for Module 3`);

  // Program 2: Self-Paced Course
  const [program2] = await db
    .insert(schema.programs)
    .values({
      tenantId: tenant.id,
      agencyId: agency.id,
      name: 'Time Management Mastery',
      description: 'Learn to manage your time effectively and boost productivity.',
      type: 'self_paced',
      status: 'active',
      config: {
        sequentialAccess: false,
        trackInScorecard: true,
      },
      createdBy: facilitator.id,
    })
    .returning();
  console.log(`  ✓ Program created: ${program2.name}`);

  const [module2_1] = await db
    .insert(schema.modules)
    .values({
      programId: program2.id,
      title: 'Prioritization Techniques',
      order: 0,
      depth: 0,
      dripType: 'immediate',
      status: 'active',
    })
    .returning();

  const _prog2Lessons = await db.insert(schema.lessons).values([
    {
      moduleId: module2_1.id,
      title: 'The Eisenhower Matrix',
      contentType: 'lesson',
      order: 0,
      durationMinutes: 20,
      points: 10,
      content: {
        introduction: 'Learn to prioritize with the Eisenhower Matrix.',
      },
      dripType: 'immediate',
      status: 'active',
    },
    {
      moduleId: module2_1.id,
      title: 'Apply the Matrix',
      contentType: 'assignment',
      order: 1,
      durationMinutes: 30,
      points: 15,
      content: {
        instructions: 'Create an Eisenhower Matrix for your current tasks.',
      },
      dripType: 'immediate',
      status: 'active',
    },
  ]).returning();
  console.log(`  ✓ Created module and lessons for ${program2.name}`);

  // 11. Create Enrollments
  console.log('\nCreating enrollments...');

  // Enroll facilitator as facilitator
  const [facilEnrollment] = await db
    .insert(schema.enrollments)
    .values({
      programId: program1.id,
      userId: facilitator.id,
      tenantId: tenant.id,
      role: 'facilitator',
      status: 'active',
    })
    .returning();
  console.log(`  ✓ Enrolled ${facilitator.email} as facilitator in ${program1.name}`);

  // Enroll mentor as mentor
  const [mentorEnrollment] = await db
    .insert(schema.enrollments)
    .values({
      programId: program1.id,
      userId: mentor.id,
      tenantId: tenant.id,
      role: 'mentor',
      status: 'active',
    })
    .returning();
  console.log(`  ✓ Enrolled ${mentor.email} as mentor in ${program1.name}`);

  // Enroll learners
  const learnerEnrollments: (typeof schema.enrollments.$inferSelect)[] = [];
  for (const learner of learners) {
    const [enrollment] = await db
      .insert(schema.enrollments)
      .values({
        programId: program1.id,
        userId: learner.id,
        tenantId: tenant.id,
        role: 'learner',
        status: 'active',
        progress: Math.floor(Math.random() * 50), // Random progress 0-50%
      })
      .returning();
    learnerEnrollments.push(enrollment);
    console.log(`  ✓ Enrolled ${learner.email} as learner in ${program1.name}`);
  }

  // 12. Create Mentor-Learner Assignments
  console.log('\nAssigning mentors to learners...');
  for (const enrollment of learnerEnrollments) {
    await db.insert(schema.enrollmentMentorships).values({
      enrollmentId: enrollment.id,
      mentorUserId: mentor.id,
      programId: program1.id,
    });
    console.log(`  ✓ Assigned mentor to enrollment ${enrollment.id}`);
  }

  // ============================================================
  // 13. Dashboard Seed Data for john.doe@techcorp.com
  // ============================================================
  console.log('\nSeeding dashboard data for John Doe...');

  const johnDoe = learners[0]; // john.doe@techcorp.com
  const johnEnrollment = learnerEnrollments[0];
  const janeSmith = learners[1];
  const janeEnrollment = learnerEnrollments[1];

  // -- Lesson Progress: John completed all of Module 1, started Module 2 --
  // Module 1: all 4 lessons completed
  for (const lesson of module1Lessons) {
    await db.insert(schema.lessonProgress).values({
      enrollmentId: johnEnrollment.id,
      lessonId: lesson.id,
      status: 'completed',
      startedAt: new Date('2026-02-03'),
      completedAt: new Date('2026-02-07'),
      pointsEarned: lesson.points,
    });
  }
  console.log('  ✓ John completed Module 1 (4 lessons)');

  // Module 2: first lesson completed, second in progress
  await db.insert(schema.lessonProgress).values({
    enrollmentId: johnEnrollment.id,
    lessonId: module2Lessons[0].id,
    status: 'completed',
    startedAt: new Date('2026-02-08'),
    completedAt: new Date('2026-02-09'),
    pointsEarned: module2Lessons[0].points,
  });
  await db.insert(schema.lessonProgress).values({
    enrollmentId: johnEnrollment.id,
    lessonId: module2Lessons[1].id,
    status: 'in_progress',
    startedAt: new Date('2026-02-10'),
    pointsEarned: 0,
  });
  console.log('  ✓ John started Module 2 (1 completed, 1 in progress)');

  // Update John's enrollment progress
  const johnCompletedLessons = 5; // 4 from module1 + 1 from module2
  const johnTotalLessons = 10; // 4 + 3 + 3
  const johnProgress = Math.round((johnCompletedLessons / johnTotalLessons) * 100);
  const johnPoints = module1Lessons.reduce((s: number, l: { points: number }) => s + l.points, 0) + module2Lessons[0].points;
  await db.update(schema.enrollments)
    .set({ progress: johnProgress, pointsEarned: johnPoints, startedAt: new Date('2026-02-03') })
    .where(eq(schema.enrollments.id, johnEnrollment.id));
  console.log(`  ✓ Updated John's enrollment: ${johnProgress}% progress, ${johnPoints} points`);

  // -- Goal Responses: John set a leadership goal --
  const [johnGoal1] = await db.insert(schema.goalResponses).values({
    lessonId: module1Lessons[2].id, // "Set Your Leadership Goal"
    enrollmentId: johnEnrollment.id,
    statement: 'Improve my ability to delegate effectively by empowering team members with clear ownership of tasks',
    successMetrics: 'Delegate at least 3 major tasks per sprint; team satisfaction score above 8/10',
    actionSteps: [
      'Identify tasks suitable for delegation each week',
      'Meet with each team member to discuss growth areas',
      'Create clear RACI charts for all projects',
      'Schedule weekly check-ins instead of daily micromanagement',
    ],
    targetDate: '2026-04-15',
    reviewFrequency: 'biweekly',
    status: 'active',
  }).returning();
  console.log('  ✓ Created goal: Delegation skills');

  // Add goal reviews
  await db.insert(schema.goalReviews).values([
    {
      goalResponseId: johnGoal1.id,
      reviewDate: '2026-02-07',
      progressPercentage: 25,
      reflectionNotes: 'Started identifying delegation opportunities. Delegated code review process to senior devs.',
      nextSteps: 'Create RACI chart for Q1 projects',
    },
    {
      goalResponseId: johnGoal1.id,
      reviewDate: '2026-02-10',
      progressPercentage: 40,
      reflectionNotes: 'RACI chart completed for 2 projects. Team is responding well to added ownership.',
      nextSteps: 'Reduce my involvement in daily standups - let team leads run them',
    },
  ]);
  console.log('  ✓ Added 2 goal reviews (40% progress)');

  // Jane's goal (on her enrollment, different unique key)
  const [_janeGoal] = await db.insert(schema.goalResponses).values({
    lessonId: module1Lessons[2].id,
    enrollmentId: janeEnrollment.id,
    statement: 'Build stronger cross-functional relationships by scheduling monthly 1:1s with peers from other departments',
    successMetrics: 'Schedule and complete 1:1s with 5 different department leads; identify 2 collaboration opportunities',
    actionSteps: [
      'Map out key stakeholders across departments',
      'Schedule introductory meetings with 2 department leads',
      'Follow up with collaboration proposals',
    ],
    targetDate: '2026-03-31',
    reviewFrequency: 'monthly',
    status: 'active',
  }).returning();
  console.log('  ✓ Created Jane\'s goal: Cross-functional relationships');

  // -- Discussion Posts: Multiple users commenting on lessons --
  // John's discussion post on Module 1 intro lesson
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module1Lessons[0].id,
    enrollmentId: johnEnrollment.id,
    userId: johnDoe.id,
    content: 'The concept of leadership as influence really resonated with me. I\'ve been too focused on authority in my role. Looking forward to shifting my approach with the team.',
    createdAt: new Date('2026-02-04T14:30:00Z'),
  });

  // Facilitator reply
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module1Lessons[0].id,
    enrollmentId: facilEnrollment.id,
    userId: facilitator.id,
    content: 'Great insight, John! That shift from authority to influence is one of the most powerful mindset changes a leader can make. How do you plan to start?',
    createdAt: new Date('2026-02-04T16:15:00Z'),
  });

  // Jane's post on the same lesson
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module1Lessons[0].id,
    enrollmentId: janeEnrollment.id,
    userId: janeSmith.id,
    content: 'I agree with John. I also found the section on servant leadership particularly eye-opening. It aligns with how I want to grow as a leader.',
    createdAt: new Date('2026-02-05T09:00:00Z'),
  });

  // Mentor comment on the assessment lesson
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module1Lessons[1].id,
    enrollmentId: mentorEnrollment.id,
    userId: mentor.id,
    content: 'For those working on the assessment, remember to be honest with yourselves. The value comes from authentic self-reflection, not from trying to get the "right" answers.',
    createdAt: new Date('2026-02-06T10:30:00Z'),
  });

  // John's reflection on the assessment
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module1Lessons[1].id,
    enrollmentId: johnEnrollment.id,
    userId: johnDoe.id,
    content: 'My assessment showed I lean heavily toward a directive style. Emily\'s advice to be honest really helped - initially I wanted to score higher on collaborative, but accepting where I am is the first step to growth.',
    createdAt: new Date('2026-02-07T11:00:00Z'),
  });

  // Discussion on Module 2 Active Listening
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module2Lessons[0].id,
    enrollmentId: johnEnrollment.id,
    userId: johnDoe.id,
    content: 'Tried the active listening techniques in my 1:1 today. The "reflect back" method made a noticeable difference - my report opened up much more than usual.',
    createdAt: new Date('2026-02-09T17:45:00Z'),
  });

  // Jane's response
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module2Lessons[0].id,
    enrollmentId: janeEnrollment.id,
    userId: janeSmith.id,
    content: 'Same experience here! I also noticed I had a habit of formulating my response while the other person was still talking. Being aware of it is already helping me improve.',
    createdAt: new Date('2026-02-10T08:20:00Z'),
  });

  // Recent post from facilitator
  await db.insert(schema.lessonDiscussions).values({
    lessonId: module2Lessons[1].id,
    enrollmentId: facilEnrollment.id,
    userId: facilitator.id,
    content: 'Reminder: the feedback framework we discussed (SBI - Situation, Behavior, Impact) is a great tool to practice this week. Try using it at least once before our next session.',
    createdAt: new Date('2026-02-11T09:00:00Z'),
  });
  console.log('  ✓ Created 8 discussion posts across lessons');

  // -- Approval Submissions: John submitted an approval for the mentor meeting --
  await db.insert(schema.approvalSubmissions).values({
    lessonId: module1Lessons[3].id, // "Mentor Check-in: Self-Awareness"
    enrollmentId: johnEnrollment.id,
    reviewerRole: 'mentor',
    submissionText: 'Completed mentor check-in session on Feb 7. Discussed self-assessment results and identified delegation as my primary growth area. Emily provided great coaching on the RACI framework.',
    submittedAt: new Date('2026-02-07T15:00:00Z'),
    status: 'approved',
    reviewedBy: mentor.id,
    reviewedAt: new Date('2026-02-07T16:30:00Z'),
    feedback: 'Great session! John showed strong self-awareness and a clear plan for improvement. Approved.',
  });
  console.log('  ✓ Created approved mentor check-in submission');

  // Pending approval for Module 2 text form
  await db.insert(schema.approvalSubmissions).values({
    lessonId: module2Lessons[2].id, // "Communication Reflection"
    enrollmentId: johnEnrollment.id,
    reviewerRole: 'facilitator',
    submissionText: 'Last week I had a challenging conversation with a cross-functional stakeholder about project priorities. I used the active listening techniques from Module 2 and found that acknowledging their concerns first before presenting my perspective led to a much more productive discussion. We were able to find a compromise that worked for both teams.',
    submittedAt: new Date('2026-02-10T16:00:00Z'),
    status: 'pending',
  });
  console.log('  ✓ Created pending communication reflection submission');

  // -- Jane's progress (partial, for leaderboard/discussions context) --
  await db.insert(schema.lessonProgress).values({
    enrollmentId: janeEnrollment.id,
    lessonId: module1Lessons[0].id,
    status: 'completed',
    startedAt: new Date('2026-02-04'),
    completedAt: new Date('2026-02-05'),
    pointsEarned: module1Lessons[0].points,
  });
  await db.insert(schema.lessonProgress).values({
    enrollmentId: janeEnrollment.id,
    lessonId: module1Lessons[1].id,
    status: 'in_progress',
    startedAt: new Date('2026-02-06'),
    pointsEarned: 0,
  });
  await db.update(schema.enrollments)
    .set({ progress: 10, pointsEarned: module1Lessons[0].points, startedAt: new Date('2026-02-04') })
    .where(eq(schema.enrollments.id, janeEnrollment.id));
  console.log('  ✓ Created Jane\'s partial progress');

  // ============================================
  // 14. Assessment Seed Data
  // ============================================
  console.log('\nSeeding assessment data...');

  // Create 2 assessment templates
  const [leadershipTemplate] = await db.insert(schema.assessmentTemplates).values({
    agencyId: agency.id,
    createdBy: agencyAdmin.id,
    name: 'Leadership 360',
    description: 'Comprehensive 360-degree leadership assessment covering core leadership competencies.',
    assessmentType: '360',
    status: 'published',
    config: {
      competencies: [
        {
          id: 'c1',
          name: 'Strategic Thinking',
          description: 'Ability to think long-term, anticipate trends, and align daily work with organizational vision.',
          questions: [
            { id: 'c1q1', text: 'Develops clear long-term plans and strategies', type: 'rating', required: true },
            { id: 'c1q2', text: 'Connects daily decisions to broader organizational goals', type: 'rating', required: true },
            { id: 'c1q3', text: 'Anticipates future challenges and prepares accordingly', type: 'rating', required: true },
          ],
        },
        {
          id: 'c2',
          name: 'Communication',
          description: 'Effectiveness in conveying information, listening actively, and fostering open dialogue.',
          questions: [
            { id: 'c2q1', text: 'Communicates ideas clearly and concisely', type: 'rating', required: true },
            { id: 'c2q2', text: 'Listens actively and considers others\' perspectives', type: 'rating', required: true },
            { id: 'c2q3', text: 'Provides constructive feedback in a timely manner', type: 'rating', required: true },
          ],
        },
        {
          id: 'c3',
          name: 'Team Development',
          description: 'Commitment to developing team members, delegating effectively, and building high-performing teams.',
          questions: [
            { id: 'c3q1', text: 'Empowers team members to take ownership of their work', type: 'rating', required: true },
            { id: 'c3q2', text: 'Invests time in coaching and developing team members', type: 'rating', required: true },
            { id: 'c3q3', text: 'Delegates tasks appropriately based on team strengths', type: 'rating', required: true },
          ],
        },
        {
          id: 'c4',
          name: 'Decision Making',
          description: 'Ability to make sound decisions, balance data with intuition, and take accountability.',
          questions: [
            { id: 'c4q1', text: 'Makes timely decisions even with incomplete information', type: 'rating', required: true },
            { id: 'c4q2', text: 'Considers multiple perspectives before deciding', type: 'rating', required: true },
            { id: 'c4q3', text: 'Takes accountability for decisions and their outcomes', type: 'rating', required: true },
          ],
        },
      ],
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Consistently'],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
      raterTypes: ['self', 'manager', 'peer', 'direct_report'],
    },
  }).returning();
  console.log('  ✓ Template created: Leadership 360');

  const [managerTemplate] = await db.insert(schema.assessmentTemplates).values({
    agencyId: agency.id,
    createdBy: agencyAdmin.id,
    name: 'Manager Effectiveness 180',
    description: 'Focused 180-degree assessment for evaluating manager effectiveness from self and manager perspectives.',
    assessmentType: '180',
    status: 'published',
    config: {
      competencies: [
        {
          id: 'mc1',
          name: 'People Management',
          description: 'Ability to manage, motivate, and retain team members.',
          questions: [
            { id: 'mc1q1', text: 'Creates a positive and inclusive team environment', type: 'rating', required: true },
            { id: 'mc1q2', text: 'Handles conflict fairly and constructively', type: 'rating', required: true },
          ],
        },
        {
          id: 'mc2',
          name: 'Execution',
          description: 'Ability to set goals, prioritize, and deliver results on time.',
          questions: [
            { id: 'mc2q1', text: 'Sets clear and measurable goals for the team', type: 'rating', required: true },
            { id: 'mc2q2', text: 'Follows through on commitments and deadlines', type: 'rating', required: true },
          ],
        },
        {
          id: 'mc3',
          name: 'Growth Mindset',
          description: 'Openness to feedback, continuous learning, and adapting to change.',
          questions: [
            { id: 'mc3q1', text: 'Seeks and acts on feedback from others', type: 'rating', required: true },
            { id: 'mc3q2', text: 'Adapts approach when faced with new challenges', type: 'rating', required: true },
          ],
        },
      ],
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
      raterTypes: ['self', 'manager'],
    },
  }).returning();
  console.log('  ✓ Template created: Manager Effectiveness 180');

  // Assessment 1: Completed 360 for Jane Smith
  // janeSmith already declared above as learners[1]
  const [completedAssessment] = await db.insert(schema.assessments).values({
    templateId: leadershipTemplate.id,
    tenantId: tenant.id,
    subjectId: janeSmith.id,
    createdBy: facilitator.id,
    name: 'Jane Smith — Leadership 360 (Q1 2026)',
    description: 'Q1 leadership assessment for Jane Smith as part of the LeaderShift program.',
    status: 'completed',
    openDate: '2026-01-10',
    closeDate: '2026-01-31',
    anonymizeResults: true,
    showResultsToSubject: true,
  }).returning();
  console.log('  ✓ Assessment created: Jane Smith Leadership 360 (completed)');

  // Raters for Jane's assessment: self, manager (facilitator), 2 peers, 1 DR
  const janeRaters = [
    { raterId: janeSmith.id, raterType: 'self' as const },
    { raterId: facilitator.id, raterType: 'manager' as const },
    { raterId: learners[0].id, raterType: 'peer' as const }, // John
    { raterId: learners[2].id, raterType: 'peer' as const }, // Alex
    { raterId: mentor.id, raterType: 'direct_report' as const },
  ];

  const janeInvitations = [];
  for (const rater of janeRaters) {
    const [inv] = await db.insert(schema.assessmentInvitations).values({
      assessmentId: completedAssessment.id,
      raterId: rater.raterId,
      raterType: rater.raterType,
      status: 'completed',
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      sentAt: new Date('2026-01-11'),
      viewedAt: new Date('2026-01-12'),
      startedAt: new Date('2026-01-13'),
      completedAt: new Date('2026-01-20'),
    }).returning();
    janeInvitations.push(inv);
  }
  console.log('  ✓ Created 5 invitations (all completed) for Jane\'s assessment');

  // Submit responses for each rater (realistic scores with gaps)
  // Self-assessment: Jane rates herself (tends to rate strategicThinking high, teamDev low)
  const janeResponses: Record<string, Record<string, { self: number; manager: number; peer1: number; peer2: number; dr: number }>> = {
    c1: {
      c1q1: { self: 4, manager: 3, peer1: 3, peer2: 3, dr: 3 },
      c1q2: { self: 4, manager: 3, peer1: 4, peer2: 3, dr: 3 },
      c1q3: { self: 5, manager: 3, peer1: 3, peer2: 3, dr: 2 },
    },
    c2: {
      c2q1: { self: 4, manager: 5, peer1: 4, peer2: 5, dr: 5 },
      c2q2: { self: 3, manager: 4, peer1: 5, peer2: 4, dr: 5 },
      c2q3: { self: 4, manager: 4, peer1: 4, peer2: 4, dr: 4 },
    },
    c3: {
      c3q1: { self: 3, manager: 3, peer1: 2, peer2: 3, dr: 2 },
      c3q2: { self: 3, manager: 2, peer1: 3, peer2: 2, dr: 3 },
      c3q3: { self: 2, manager: 3, peer1: 2, peer2: 3, dr: 2 },
    },
    c4: {
      c4q1: { self: 4, manager: 4, peer1: 4, peer2: 4, dr: 4 },
      c4q2: { self: 4, manager: 5, peer1: 4, peer2: 4, dr: 5 },
      c4q3: { self: 5, manager: 4, peer1: 5, peer2: 4, dr: 4 },
    },
  };

  const raterKeys = ['self', 'manager', 'peer1', 'peer2', 'dr'] as const;
  const overallComments = [
    'I think I need to work more on delegating effectively.', // self
    'Jane is strong in communication but could improve strategic planning visibility.', // manager
    'Great team player, always willing to help. Sometimes takes on too much herself.', // peer1
    'Jane communicates really well but I wish she would share her strategic thinking more openly.', // peer2
    'Excellent listener. Could delegate more to develop the team.', // dr
  ];

  for (let i = 0; i < janeInvitations.length; i++) {
    const key = raterKeys[i];
    const responses: { competencyId: string; questionId: string; rating: number; comment?: string }[] = [];

    for (const [compId, questions] of Object.entries(janeResponses)) {
      for (const [qId, ratings] of Object.entries(questions)) {
        responses.push({
          competencyId: compId,
          questionId: qId,
          rating: ratings[key],
        });
      }
    }

    await db.insert(schema.assessmentResponses).values({
      invitationId: janeInvitations[i].id,
      responses,
      overallComments: overallComments[i],
      submittedAt: new Date('2026-01-20'),
      isComplete: true,
    });
  }
  console.log('  ✓ Created 5 complete responses for Jane\'s assessment');

  // Assessment 2: Active 360 for John Doe (2 of 5 complete)
  const [activeAssessment] = await db.insert(schema.assessments).values({
    templateId: leadershipTemplate.id,
    tenantId: tenant.id,
    subjectId: johnDoe.id,
    createdBy: facilitator.id,
    name: 'John Doe — Leadership 360 (Q1 2026)',
    description: 'Q1 leadership assessment for John Doe.',
    status: 'open',
    openDate: '2026-02-01',
    closeDate: '2026-02-28',
    anonymizeResults: true,
    showResultsToSubject: true,
  }).returning();
  console.log('  ✓ Assessment created: John Doe Leadership 360 (active)');

  const johnRaters = [
    { raterId: johnDoe.id, raterType: 'self' as const, status: 'completed' as const },
    { raterId: facilitator.id, raterType: 'manager' as const, status: 'completed' as const },
    { raterId: janeSmith.id, raterType: 'peer' as const, status: 'sent' as const },
    { raterId: learners[2].id, raterType: 'peer' as const, status: 'viewed' as const },
    { raterId: mentor.id, raterType: 'direct_report' as const, status: 'pending' as const },
  ];

  for (const rater of johnRaters) {
    const [inv] = await db.insert(schema.assessmentInvitations).values({
      assessmentId: activeAssessment.id,
      raterId: rater.raterId,
      raterType: rater.raterType,
      status: rater.status,
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      sentAt: rater.status !== 'pending' ? new Date('2026-02-02') : null,
      viewedAt: ['viewed', 'started', 'completed'].includes(rater.status) ? new Date('2026-02-03') : null,
      completedAt: rater.status === 'completed' ? new Date('2026-02-05') : null,
    }).returning();

    // Submit responses for completed raters only
    if (rater.status === 'completed') {
      const responses = [];
      for (const [compId, questions] of Object.entries(janeResponses)) {
        for (const qId of Object.keys(questions)) {
          responses.push({
            competencyId: compId,
            questionId: qId,
            rating: Math.floor(Math.random() * 2) + 3, // random 3-4
          });
        }
      }
      await db.insert(schema.assessmentResponses).values({
        invitationId: inv.id,
        responses,
        overallComments: rater.raterType === 'self' ? 'I feel I am growing in my leadership skills.' : 'John is making good progress.',
        submittedAt: new Date('2026-02-05'),
        isComplete: true,
      });
    }
  }
  console.log('  ✓ Created 5 invitations (2 completed) for John\'s assessment');

  // Assessment 3: Draft 180 for Alex Wilson
  await db.insert(schema.assessments).values({
    templateId: managerTemplate.id,
    tenantId: tenant.id,
    subjectId: learners[2].id,
    createdBy: facilitator.id,
    name: 'Alex Wilson — Manager Effectiveness 180',
    description: 'Manager effectiveness assessment for Alex Wilson.',
    status: 'draft',
    anonymizeResults: true,
    showResultsToSubject: true,
  });
  console.log('  ✓ Assessment created: Alex Wilson Manager 180 (draft)');

  console.log('\n✅ Assessment seed data complete!');

  // ============================================
  // 15. LeaderShift™ Assessment Seed Data
  // ============================================
  console.log('\nSeeding LeaderShift™ assessment data...');

  const [leaderShiftTemplate] = await db.insert(schema.assessmentTemplates).values({
    agencyId: agency.id,
    createdBy: agencyAdmin.id,
    name: 'LeaderShift™ Leadership Capacity Stress Test',
    description: 'A frequency-based leadership assessment measuring six core capacities under pressure. Includes reverse-scored items and a Coaching Capacity Index.',
    assessmentType: '360',
    status: 'published',
    config: {
      competencies: [
        {
          id: 'vision',
          name: 'VISION',
          subtitle: 'Direction Must Hold Under Pressure',
          description: 'The ability to maintain clear strategic direction even when under significant organizational pressure.',
          questions: [
            { id: 'v1', text: 'This leader maintains clear long-term direction even when under significant pressure.', type: 'rating', required: true },
            { id: 'v2', text: 'Strategic priorities remain aligned with a defined future state.', type: 'rating', required: true },
            { id: 'v3', text: 'The team confidently articulates where the organization is headed and why.', type: 'rating', required: true },
            { id: 'v4', text: 'Decisions reflect long-term intent over short-term relief.', type: 'rating', required: true },
            { id: 'v5', text: 'Direction remains steady when challenged or resisted.', type: 'rating', required: true },
            { id: 'v6', text: 'Daily execution measurably advances a defined future state.', type: 'rating', required: true },
            { id: 'v7', text: 'This leader challenges others to think strategically about long-term impact.', type: 'rating', required: true, isCCI: true },
            { id: 'v8', text: 'Strategic direction shifts when short-term pressure increases.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'clarity',
          name: 'CLARITY',
          subtitle: 'Structure Must Reduce Friction',
          description: 'The ability to create explicit role clarity, performance metrics, and outcome-based accountability.',
          questions: [
            { id: 'cl1', text: 'Role accountabilities are explicit and outcome-based.', type: 'rating', required: true },
            { id: 'cl2', text: 'The 3–5 core results of each role are clearly defined and documented.', type: 'rating', required: true },
            { id: 'cl3', text: 'Performance metrics are visible and actively reviewed.', type: 'rating', required: true },
            { id: 'cl4', text: 'Ownership of results is unmistakable.', type: 'rating', required: true },
            { id: 'cl5', text: 'Performance discussions are grounded in measurable outcomes.', type: 'rating', required: true },
            { id: 'cl6', text: 'This leader eliminates ambiguity that slows execution.', type: 'rating', required: true },
            { id: 'cl7', text: 'This leader requires team members to define clear success criteria before action.', type: 'rating', required: true, isCCI: true },
            { id: 'cl8', text: 'Role ambiguity contributes to execution delays.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'teamwork',
          name: 'TEAMWORK',
          subtitle: 'Tension Must Improve Performance',
          description: 'The capacity to build trust under pressure, address conflict directly, and prioritize enterprise results.',
          questions: [
            { id: 'tw1', text: 'Leadership team members demonstrate trust under pressure.', type: 'rating', required: true },
            { id: 'tw2', text: 'Difficult issues are addressed directly and in the room.', type: 'rating', required: true },
            { id: 'tw3', text: 'Productive conflict strengthens decisions.', type: 'rating', required: true },
            { id: 'tw4', text: 'Enterprise results outweigh departmental preferences.', type: 'rating', required: true },
            { id: 'tw5', text: 'Cross-functional coordination is disciplined and reliable.', type: 'rating', required: true },
            { id: 'tw6', text: 'Feedback is exchanged without political consequence.', type: 'rating', required: true },
            { id: 'tw7', text: 'This leader elevates the level of dialogue during disagreement.', type: 'rating', required: true, isCCI: true },
            { id: 'tw8', text: 'Significant issues are discussed outside formal forums rather than openly.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'candor',
          name: 'CANDOR',
          subtitle: 'Standards Must Be Protected',
          description: 'The willingness to address underperformance promptly, communicate difficult truths, and maintain high standards.',
          questions: [
            { id: 'ca1', text: 'Underperformance is addressed promptly and clearly.', type: 'rating', required: true },
            { id: 'ca2', text: 'Expectations and standards are explicit and reinforced.', type: 'rating', required: true },
            { id: 'ca3', text: 'Feedback is precise and tied to measurable outcomes.', type: 'rating', required: true },
            { id: 'ca4', text: 'Difficult truths are communicated regardless of hierarchy.', type: 'rating', required: true },
            { id: 'ca5', text: 'Performance data is openly visible and discussed.', type: 'rating', required: true },
            { id: 'ca6', text: 'Mediocrity is corrected before it becomes normalized.', type: 'rating', required: true },
            { id: 'ca7', text: 'This leader requires others to confront the gap between intent and impact.', type: 'rating', required: true, isCCI: true },
            { id: 'ca8', text: 'Poor performance is excused to avoid discomfort.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'accountability',
          name: 'ACCOUNTABILITY',
          subtitle: 'Commitments Must Mean Something',
          description: 'The discipline to ensure commitments include clear deadlines, coaching checkpoints, and meaningful consequences.',
          questions: [
            { id: 'ac1', text: 'Commitments include clear deadlines and measurable outcomes.', type: 'rating', required: true },
            { id: 'ac2', text: 'Coaching conversations include defined follow-up checkpoints.', type: 'rating', required: true },
            { id: 'ac3', text: 'Progress toward goals is reviewed on a disciplined cadence.', type: 'rating', required: true },
            { id: 'ac4', text: 'Missed commitments trigger corrective action.', type: 'rating', required: true },
            { id: 'ac5', text: 'This leader takes full responsibility for results in their scope.', type: 'rating', required: true },
            { id: 'ac6', text: 'Repeated underperformance leads to visible consequences.', type: 'rating', required: true },
            { id: 'ac7', text: 'This leader requires others to state explicit commitments before closing discussions.', type: 'rating', required: true, isCCI: true },
            { id: 'ac8', text: 'Missed commitments are tolerated without meaningful follow-up.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'change',
          name: 'CHANGE',
          subtitle: 'Improvement Must Be Continuous',
          description: 'The ability to update thinking when evidence warrants, redesign underperforming systems, and challenge the status quo.',
          questions: [
            { id: 'ch1', text: 'The leader updates thinking when evidence warrants it.', type: 'rating', required: true },
            { id: 'ch2', text: 'Underperforming systems are redesigned without delay.', type: 'rating', required: true },
            { id: 'ch3', text: 'Change initiatives are structured and completed.', type: 'rating', required: true },
            { id: 'ch4', text: 'Performance improves quarter over quarter.', type: 'rating', required: true },
            { id: 'ch5', text: 'Experimentation is encouraged when results plateau.', type: 'rating', required: true },
            { id: 'ch6', text: 'The status quo is challenged when it limits growth.', type: 'rating', required: true },
            { id: 'ch7', text: 'During change, this leader pushes others to generate forward-thinking solutions.', type: 'rating', required: true, isCCI: true },
            { id: 'ch8', text: 'Existing systems are defended despite declining results.', type: 'rating', required: true, reverseScored: true },
          ],
        },
      ],
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ['Never', 'Rarely', 'Sometimes', 'Frequently', 'Consistently'],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
      raterTypes: ['self', 'manager', 'peer', 'direct_report'],
    },
  }).returning();
  console.log('  ✓ Template created: LeaderShift™ Leadership Capacity Stress Test');

  // ------------------------------------------------------------------
  // Assessment 4: Completed LeaderShift 360 for John Doe
  // ------------------------------------------------------------------
  const [lsAssessment360] = await db.insert(schema.assessments).values({
    templateId: leaderShiftTemplate.id,
    tenantId: tenant.id,
    subjectId: johnDoe.id,
    createdBy: facilitator.id,
    name: 'John Doe — LeaderShift™ 360 (Q1 2026)',
    description: 'Full 360-degree LeaderShift assessment for John Doe. Covers VISION, CLARITY, TEAMWORK, CANDOR, ACCOUNTABILITY, and CHANGE.',
    status: 'completed',
    openDate: '2026-01-05',
    closeDate: '2026-01-25',
    anonymizeResults: true,
    showResultsToSubject: true,
  }).returning();
  console.log('  ✓ Assessment created: John Doe LeaderShift 360 (completed)');

  // 5 raters: self, manager, 2 peers, 1 direct report
  const lsRaters360 = [
    { raterId: johnDoe.id, raterType: 'self' as const },
    { raterId: facilitator.id, raterType: 'manager' as const },
    { raterId: janeSmith.id, raterType: 'peer' as const },
    { raterId: learners[2].id, raterType: 'peer' as const }, // Alex
    { raterId: mentor.id, raterType: 'direct_report' as const },
  ];

  const lsInvitations360 = [];
  for (const rater of lsRaters360) {
    const [inv] = await db.insert(schema.assessmentInvitations).values({
      assessmentId: lsAssessment360.id,
      raterId: rater.raterId,
      raterType: rater.raterType,
      status: 'completed',
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      sentAt: new Date('2026-01-06'),
      viewedAt: new Date('2026-01-07'),
      startedAt: new Date('2026-01-08'),
      completedAt: new Date('2026-01-20'),
    }).returning();
    lsInvitations360.push(inv);
  }
  console.log('  ✓ Created 5 invitations (all completed) for John\'s LeaderShift 360');

  // Response data: competencyId → questionId → [self, manager, peer1, peer2, dr]
  // Patterns:
  //   VISION     — strong area, Self slightly over-rates
  //   CLARITY    — moderate, fairly aligned
  //   TEAMWORK   — blind spot (Self=high, Others=low)
  //   CANDOR     — hidden strength (Self=low, Others=high)
  //   ACCOUNTABILITY — moderate, aligned
  //   CHANGE     — weakest area → becomes "Current Ceiling"
  // Q8 in each competency is reverse-scored [R] — low raw = good behavior
  const lsScores: Record<string, number[][]> = {
    vision: [
      // v1   v2   v3   v4   v5   v6   v7(CCI) v8[R]
      [5,   4,   4,   5,   4,   4,   4,       2], // self
      [4,   3,   4,   4,   3,   3,   3,       2], // manager
      [4,   4,   3,   4,   4,   3,   4,       2], // peer1
      [4,   3,   4,   4,   3,   3,   3,       3], // peer2
      [3,   3,   3,   3,   3,   3,   3,       2], // dr
    ],
    clarity: [
      [4,   4,   4,   4,   3,   4,   4,       2], // self
      [3,   3,   4,   3,   3,   3,   3,       3], // manager
      [3,   3,   3,   3,   3,   3,   3,       3], // peer1
      [3,   3,   3,   4,   3,   3,   3,       3], // peer2
      [3,   2,   3,   3,   3,   3,   3,       3], // dr
    ],
    teamwork: [
      [4,   5,   4,   4,   4,   4,   4,       2], // self  ← over-rates
      [2,   3,   2,   3,   2,   3,   2,       4], // manager ← sees issues
      [3,   2,   2,   2,   2,   2,   2,       4], // peer1
      [2,   2,   3,   2,   3,   2,   2,       4], // peer2
      [2,   2,   2,   3,   2,   2,   2,       4], // dr
    ],
    candor: [
      [2,   3,   2,   2,   3,   2,   2,       4], // self  ← under-rates
      [4,   4,   4,   3,   4,   4,   4,       2], // manager ← sees strength
      [4,   3,   4,   4,   3,   4,   3,       2], // peer1
      [3,   4,   3,   4,   4,   3,   4,       2], // peer2
      [4,   4,   3,   4,   3,   3,   4,       2], // dr
    ],
    accountability: [
      [4,   3,   4,   3,   4,   3,   3,       3], // self
      [3,   3,   4,   3,   4,   3,   3,       3], // manager
      [3,   4,   3,   3,   3,   3,   3,       3], // peer1
      [4,   3,   3,   3,   3,   4,   3,       3], // peer2
      [3,   3,   3,   3,   4,   3,   3,       3], // dr
    ],
    change: [
      [3,   3,   3,   3,   3,   3,   3,       3], // self  ← weakest
      [2,   2,   3,   2,   2,   2,   2,       4], // manager
      [2,   2,   2,   2,   3,   2,   2,       4], // peer1
      [2,   2,   2,   3,   2,   2,   2,       4], // peer2
      [2,   2,   2,   2,   2,   2,   2,       4], // dr
    ],
  };

  const lsQuestionIds: Record<string, string[]> = {
    vision: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'],
    clarity: ['cl1', 'cl2', 'cl3', 'cl4', 'cl5', 'cl6', 'cl7', 'cl8'],
    teamwork: ['tw1', 'tw2', 'tw3', 'tw4', 'tw5', 'tw6', 'tw7', 'tw8'],
    candor: ['ca1', 'ca2', 'ca3', 'ca4', 'ca5', 'ca6', 'ca7', 'ca8'],
    accountability: ['ac1', 'ac2', 'ac3', 'ac4', 'ac5', 'ac6', 'ac7', 'ac8'],
    change: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8'],
  };

  const ls360Comments = [
    'I need to work on being more open to team input. I tend to drive decisions independently.', // self
    'John is strategically strong but needs to address teamwork dynamics. His team sometimes avoids open conflict.', // manager
    'John is very direct with feedback, which I appreciate. Could improve on creating psychological safety in group settings.', // peer1
    'Strong leader with clear vision. Team meetings could be more collaborative — he tends to dominate.', // peer2
    'Very honest and transparent about performance expectations. Change management is an area that could use attention.', // dr
  ];

  for (let i = 0; i < lsInvitations360.length; i++) {
    const responses: { competencyId: string; questionId: string; rating: number }[] = [];
    for (const [compId, qIds] of Object.entries(lsQuestionIds)) {
      for (let q = 0; q < qIds.length; q++) {
        responses.push({
          competencyId: compId,
          questionId: qIds[q],
          rating: lsScores[compId][i][q],
        });
      }
    }
    await db.insert(schema.assessmentResponses).values({
      invitationId: lsInvitations360[i].id,
      responses,
      overallComments: ls360Comments[i],
      submittedAt: new Date('2026-01-20'),
      isComplete: true,
    });
  }
  console.log('  ✓ Created 5 complete responses for John\'s LeaderShift 360');

  // ------------------------------------------------------------------
  // Assessment 5: Completed LeaderShift 180 for Alex Wilson (Self + Boss)
  // ------------------------------------------------------------------
  // Create a 180 variant of the LeaderShift template
  const [leaderShift180Template] = await db.insert(schema.assessmentTemplates).values({
    agencyId: agency.id,
    createdBy: agencyAdmin.id,
    name: 'LeaderShift™ 180 (Self + Boss)',
    description: 'A 180-degree variant of the LeaderShift assessment — Self and Manager/Boss perspectives only.',
    assessmentType: '180',
    status: 'published',
    // Same competencies/questions, different rater types
    config: {
      competencies: [
        {
          id: 'vision', name: 'VISION', subtitle: 'Direction Must Hold Under Pressure',
          description: 'The ability to maintain clear strategic direction even when under significant organizational pressure.',
          questions: [
            { id: 'v1', text: 'This leader maintains clear long-term direction even when under significant pressure.', type: 'rating', required: true },
            { id: 'v2', text: 'Strategic priorities remain aligned with a defined future state.', type: 'rating', required: true },
            { id: 'v3', text: 'The team confidently articulates where the organization is headed and why.', type: 'rating', required: true },
            { id: 'v4', text: 'Decisions reflect long-term intent over short-term relief.', type: 'rating', required: true },
            { id: 'v5', text: 'Direction remains steady when challenged or resisted.', type: 'rating', required: true },
            { id: 'v6', text: 'Daily execution measurably advances a defined future state.', type: 'rating', required: true },
            { id: 'v7', text: 'This leader challenges others to think strategically about long-term impact.', type: 'rating', required: true, isCCI: true },
            { id: 'v8', text: 'Strategic direction shifts when short-term pressure increases.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'clarity', name: 'CLARITY', subtitle: 'Structure Must Reduce Friction',
          description: 'The ability to create explicit role clarity, performance metrics, and outcome-based accountability.',
          questions: [
            { id: 'cl1', text: 'Role accountabilities are explicit and outcome-based.', type: 'rating', required: true },
            { id: 'cl2', text: 'The 3–5 core results of each role are clearly defined and documented.', type: 'rating', required: true },
            { id: 'cl3', text: 'Performance metrics are visible and actively reviewed.', type: 'rating', required: true },
            { id: 'cl4', text: 'Ownership of results is unmistakable.', type: 'rating', required: true },
            { id: 'cl5', text: 'Performance discussions are grounded in measurable outcomes.', type: 'rating', required: true },
            { id: 'cl6', text: 'This leader eliminates ambiguity that slows execution.', type: 'rating', required: true },
            { id: 'cl7', text: 'This leader requires team members to define clear success criteria before action.', type: 'rating', required: true, isCCI: true },
            { id: 'cl8', text: 'Role ambiguity contributes to execution delays.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'teamwork', name: 'TEAMWORK', subtitle: 'Tension Must Improve Performance',
          description: 'The capacity to build trust under pressure, address conflict directly, and prioritize enterprise results.',
          questions: [
            { id: 'tw1', text: 'Leadership team members demonstrate trust under pressure.', type: 'rating', required: true },
            { id: 'tw2', text: 'Difficult issues are addressed directly and in the room.', type: 'rating', required: true },
            { id: 'tw3', text: 'Productive conflict strengthens decisions.', type: 'rating', required: true },
            { id: 'tw4', text: 'Enterprise results outweigh departmental preferences.', type: 'rating', required: true },
            { id: 'tw5', text: 'Cross-functional coordination is disciplined and reliable.', type: 'rating', required: true },
            { id: 'tw6', text: 'Feedback is exchanged without political consequence.', type: 'rating', required: true },
            { id: 'tw7', text: 'This leader elevates the level of dialogue during disagreement.', type: 'rating', required: true, isCCI: true },
            { id: 'tw8', text: 'Significant issues are discussed outside formal forums rather than openly.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'candor', name: 'CANDOR', subtitle: 'Standards Must Be Protected',
          description: 'The willingness to address underperformance promptly, communicate difficult truths, and maintain high standards.',
          questions: [
            { id: 'ca1', text: 'Underperformance is addressed promptly and clearly.', type: 'rating', required: true },
            { id: 'ca2', text: 'Expectations and standards are explicit and reinforced.', type: 'rating', required: true },
            { id: 'ca3', text: 'Feedback is precise and tied to measurable outcomes.', type: 'rating', required: true },
            { id: 'ca4', text: 'Difficult truths are communicated regardless of hierarchy.', type: 'rating', required: true },
            { id: 'ca5', text: 'Performance data is openly visible and discussed.', type: 'rating', required: true },
            { id: 'ca6', text: 'Mediocrity is corrected before it becomes normalized.', type: 'rating', required: true },
            { id: 'ca7', text: 'This leader requires others to confront the gap between intent and impact.', type: 'rating', required: true, isCCI: true },
            { id: 'ca8', text: 'Poor performance is excused to avoid discomfort.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'accountability', name: 'ACCOUNTABILITY', subtitle: 'Commitments Must Mean Something',
          description: 'The discipline to ensure commitments include clear deadlines, coaching checkpoints, and meaningful consequences.',
          questions: [
            { id: 'ac1', text: 'Commitments include clear deadlines and measurable outcomes.', type: 'rating', required: true },
            { id: 'ac2', text: 'Coaching conversations include defined follow-up checkpoints.', type: 'rating', required: true },
            { id: 'ac3', text: 'Progress toward goals is reviewed on a disciplined cadence.', type: 'rating', required: true },
            { id: 'ac4', text: 'Missed commitments trigger corrective action.', type: 'rating', required: true },
            { id: 'ac5', text: 'This leader takes full responsibility for results in their scope.', type: 'rating', required: true },
            { id: 'ac6', text: 'Repeated underperformance leads to visible consequences.', type: 'rating', required: true },
            { id: 'ac7', text: 'This leader requires others to state explicit commitments before closing discussions.', type: 'rating', required: true, isCCI: true },
            { id: 'ac8', text: 'Missed commitments are tolerated without meaningful follow-up.', type: 'rating', required: true, reverseScored: true },
          ],
        },
        {
          id: 'change', name: 'CHANGE', subtitle: 'Improvement Must Be Continuous',
          description: 'The ability to update thinking when evidence warrants, redesign underperforming systems, and challenge the status quo.',
          questions: [
            { id: 'ch1', text: 'The leader updates thinking when evidence warrants it.', type: 'rating', required: true },
            { id: 'ch2', text: 'Underperforming systems are redesigned without delay.', type: 'rating', required: true },
            { id: 'ch3', text: 'Change initiatives are structured and completed.', type: 'rating', required: true },
            { id: 'ch4', text: 'Performance improves quarter over quarter.', type: 'rating', required: true },
            { id: 'ch5', text: 'Experimentation is encouraged when results plateau.', type: 'rating', required: true },
            { id: 'ch6', text: 'The status quo is challenged when it limits growth.', type: 'rating', required: true },
            { id: 'ch7', text: 'During change, this leader pushes others to generate forward-thinking solutions.', type: 'rating', required: true, isCCI: true },
            { id: 'ch8', text: 'Existing systems are defended despite declining results.', type: 'rating', required: true, reverseScored: true },
          ],
        },
      ],
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ['Never', 'Rarely', 'Sometimes', 'Frequently', 'Consistently'],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
      raterTypes: ['self', 'manager'],
    },
  }).returning();
  console.log('  ✓ Template created: LeaderShift™ 180 (Self + Boss)');

  const alexWilson = learners[2];
  const [lsAssessment180] = await db.insert(schema.assessments).values({
    templateId: leaderShift180Template.id,
    tenantId: tenant.id,
    subjectId: alexWilson.id,
    createdBy: facilitator.id,
    name: 'Alex Wilson — LeaderShift™ 180 (Q1 2026)',
    description: '180-degree LeaderShift assessment for Alex Wilson. Self and Boss perspectives.',
    status: 'completed',
    openDate: '2026-01-10',
    closeDate: '2026-01-28',
    anonymizeResults: true,
    showResultsToSubject: true,
  }).returning();
  console.log('  ✓ Assessment created: Alex Wilson LeaderShift 180 (completed)');

  const lsRaters180 = [
    { raterId: alexWilson.id, raterType: 'self' as const },
    { raterId: facilitator.id, raterType: 'manager' as const },
  ];

  const lsInvitations180 = [];
  for (const rater of lsRaters180) {
    const [inv] = await db.insert(schema.assessmentInvitations).values({
      assessmentId: lsAssessment180.id,
      raterId: rater.raterId,
      raterType: rater.raterType,
      status: 'completed',
      accessToken: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      sentAt: new Date('2026-01-11'),
      viewedAt: new Date('2026-01-12'),
      startedAt: new Date('2026-01-13'),
      completedAt: new Date('2026-01-22'),
    }).returning();
    lsInvitations180.push(inv);
  }
  console.log('  ✓ Created 2 invitations (all completed) for Alex\'s LeaderShift 180');

  // Alex 180 scores: Self vs Boss
  // Self tends to over-rate VISION and ACCOUNTABILITY, Boss sees CLARITY as weakest
  const ls180Scores: Record<string, number[][]> = {
    vision: [
      // v1  v2  v3  v4  v5  v6  v7(CCI) v8[R]
      [4,  4,  5,  4,  4,  4,  4,      2], // self  ← confident
      [3,  3,  3,  3,  3,  3,  3,      3], // boss  ← more conservative
    ],
    clarity: [
      [3,  3,  3,  3,  3,  3,  3,      3], // self
      [2,  2,  2,  2,  2,  2,  2,      4], // boss  ← sees real gap
    ],
    teamwork: [
      [3,  3,  4,  3,  3,  3,  3,      3], // self
      [3,  4,  3,  3,  3,  4,  3,      3], // boss  ← similar view
    ],
    candor: [
      [3,  3,  3,  3,  3,  3,  3,      3], // self
      [4,  4,  4,  4,  3,  4,  4,      2], // boss  ← sees hidden strength
    ],
    accountability: [
      [4,  4,  4,  4,  5,  4,  4,      2], // self  ← over-rates
      [3,  3,  3,  3,  3,  3,  3,      3], // boss
    ],
    change: [
      [3,  3,  3,  3,  3,  3,  3,      3], // self
      [3,  3,  3,  3,  3,  3,  3,      3], // boss  ← aligned, moderate
    ],
  };

  const ls180Comments = [
    'I believe I have strong strategic vision but recognize I may need to improve structural clarity for my team.',
    'Alex has untapped potential in candor — he provides excellent direct feedback when he chooses to. Clarity and documentation are areas that need consistent attention.',
  ];

  for (let i = 0; i < lsInvitations180.length; i++) {
    const responses: { competencyId: string; questionId: string; rating: number }[] = [];
    for (const [compId, qIds] of Object.entries(lsQuestionIds)) {
      for (let q = 0; q < qIds.length; q++) {
        responses.push({
          competencyId: compId,
          questionId: qIds[q],
          rating: ls180Scores[compId][i][q],
        });
      }
    }
    await db.insert(schema.assessmentResponses).values({
      invitationId: lsInvitations180[i].id,
      responses,
      overallComments: ls180Comments[i],
      submittedAt: new Date('2026-01-22'),
      isComplete: true,
    });
  }
  console.log('  ✓ Created 2 complete responses for Alex\'s LeaderShift 180');

  console.log('\n✅ LeaderShift™ seed data complete!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

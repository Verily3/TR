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

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
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
  const module3Lessons = await db.insert(schema.lessons).values([
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

  const prog2Lessons = await db.insert(schema.lessons).values([
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
  const johnPoints = module1Lessons.reduce((s, l) => s + l.points, 0) + module2Lessons[0].points;
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
  const [janeGoal] = await db.insert(schema.goalResponses).values({
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

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

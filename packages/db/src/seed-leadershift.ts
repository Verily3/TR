/**
 * LeaderShift Program Seed Script
 * Creates the full LeaderShift leadership development program
 * with modules, events, lessons, and tasks.
 *
 * Prerequisites: Run `db:seed` first to create tenant, users, etc.
 * Usage: pnpm --filter @tr/db db:seed-leadershift
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ============================================
// Types
// ============================================

interface TaskDef {
  title: string;
  description?: string;
  responseType: 'text' | 'file_upload' | 'goal' | 'completion_click' | 'discussion';
  approvalRequired?: 'none' | 'mentor' | 'facilitator' | 'both';
  points: number;
  config?: Record<string, unknown>;
}

interface LessonDef {
  title: string;
  contentType: 'lesson' | 'assignment' | 'text_form' | 'goal' | 'quiz';
  durationMinutes: number;
  points: number;
  approvalRequired?: 'none' | 'mentor' | 'facilitator' | 'both';
  content: Record<string, unknown>;
  tasks?: TaskDef[];
}

interface ModuleDef {
  title: string;
  description: string;
  order: number;
  dripType: 'immediate' | 'days_after_enrollment' | 'days_after_previous' | 'on_date';
  dripValue?: number;
}

interface EventDef {
  title: string;
  description: string;
  order: number;
  eventConfig: {
    date?: string;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    location?: string;
    zoomLink?: string;
    meetingId?: string;
    meetingPassword?: string;
    description?: string;
    videoUrl?: string;
  };
}

// ============================================
// Helper
// ============================================

async function createModuleWithLessons(
  programId: string,
  moduleDef: ModuleDef,
  lessonDefs: LessonDef[]
) {
  const [mod] = await db
    .insert(schema.modules)
    .values({
      programId,
      title: moduleDef.title,
      description: moduleDef.description,
      order: moduleDef.order,
      depth: 0,
      dripType: moduleDef.dripType,
      dripValue: moduleDef.dripValue ?? null,
      status: 'active',
    })
    .returning();

  const lessonValues = lessonDefs.map((def, idx) => ({
    moduleId: mod.id,
    title: def.title,
    contentType: def.contentType,
    order: idx,
    durationMinutes: def.durationMinutes,
    points: def.points,
    content: def.content,
    dripType: (idx === 0 ? 'immediate' : 'sequential') as 'immediate' | 'sequential',
    approvalRequired: (def.approvalRequired ?? 'none') as 'none' | 'mentor' | 'facilitator' | 'both',
    status: 'active' as const,
  }));

  const insertedLessons = await db.insert(schema.lessons).values(lessonValues).returning();

  // Create tasks for lessons that have them
  let totalTasks = 0;
  for (let i = 0; i < lessonDefs.length; i++) {
    const def = lessonDefs[i];
    if (def.tasks && def.tasks.length > 0) {
      const lesson = insertedLessons[i];
      const taskValues = def.tasks.map((t, tidx) => ({
        lessonId: lesson.id,
        title: t.title,
        description: t.description ?? null,
        order: tidx,
        responseType: t.responseType,
        approvalRequired: (t.approvalRequired ?? 'none') as 'none' | 'mentor' | 'facilitator' | 'both',
        points: t.points,
        config: t.config ?? null,
        status: 'active' as const,
      }));
      await db.insert(schema.lessonTasks).values(taskValues);
      totalTasks += def.tasks.length;
    }
  }

  const totalPoints = lessonDefs.reduce((sum, l) => sum + l.points, 0);
  const taskInfo = totalTasks > 0 ? `, ${totalTasks} tasks` : '';
  console.log(`  ✓ Module ${moduleDef.order}: "${moduleDef.title}" — ${lessonDefs.length} lessons${taskInfo}, ${totalPoints} pts`);
  return { mod, lessons: insertedLessons };
}

async function createEvent(programId: string, eventDef: EventDef) {
  const [mod] = await db
    .insert(schema.modules)
    .values({
      programId,
      title: eventDef.title,
      description: eventDef.description,
      order: eventDef.order,
      depth: 0,
      type: 'event',
      eventConfig: eventDef.eventConfig,
      dripType: 'immediate',
      status: 'active',
    })
    .returning();

  console.log(`  ✓ Event ${eventDef.order}: "${eventDef.title}" (${eventDef.eventConfig.date || 'TBD'})`);
  return mod;
}

// ============================================
// Reusable lesson templates
// ============================================

function actionStepLesson(): LessonDef {
  return {
    title: 'My Action Step',
    contentType: 'text_form',
    durationMinutes: 10,
    points: 10,
    content: {
      formPrompt: 'Each module we set an action step to establish more productive habits. What is your action step for this period? It should begin with "At least once a day I will..."',
      minLength: 50,
      enableDiscussion: true,
    },
  };
}

function mostUsefulIdeaLesson(): LessonDef {
  return {
    title: 'Most Useful Idea',
    contentType: 'text_form',
    durationMinutes: 10,
    points: 10,
    content: {
      formPrompt: "What was the most useful idea from this module's content? How will you apply it in your leadership this week?",
      minLength: 50,
      enableDiscussion: true,
    },
  };
}

function coachMeetingLesson(): LessonDef {
  return {
    title: 'Coach Meeting',
    contentType: 'assignment',
    durationMinutes: 10,
    points: 10,
    approvalRequired: 'mentor',
    content: {
      instructions: 'After your coaching meeting, summarize the key takeaways and action items discussed. Your coach will review and confirm.',
      formPrompt: 'Summarize the key takeaways and action items from your coaching session for this module.',
    },
  };
}

function videoLesson(title: string, introduction: string, videoUrl: string, mainContent: string): LessonDef {
  return {
    title,
    contentType: 'lesson',
    durationMinutes: 20,
    points: 10,
    content: { introduction, videoUrl, mainContent },
  };
}

// ============================================
// Main seed function
// ============================================

async function seedLeaderShift() {
  console.log('🚀 Seeding LeaderShift program...\n');

  // 1. Look up existing records
  console.log('Looking up existing records...');

  const agency = await db.query.agencies.findFirst({
    where: eq(schema.agencies.slug, 'acme'),
  });
  if (!agency) throw new Error('Agency "acme" not found. Run db:seed first.');

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.slug, 'techcorp'),
  });
  if (!tenant) throw new Error('Tenant "techcorp" not found. Run db:seed first.');

  const facilitator = await db.query.users.findFirst({
    where: eq(schema.users.email, 'coach@techcorp.com'),
  });
  if (!facilitator) throw new Error('Facilitator not found. Run db:seed first.');

  const mentor = await db.query.users.findFirst({
    where: eq(schema.users.email, 'mentor@techcorp.com'),
  });
  if (!mentor) throw new Error('Mentor not found. Run db:seed first.');

  const learner1 = await db.query.users.findFirst({
    where: eq(schema.users.email, 'john.doe@techcorp.com'),
  });
  const learner2 = await db.query.users.findFirst({
    where: eq(schema.users.email, 'jane.smith@techcorp.com'),
  });
  const learner3 = await db.query.users.findFirst({
    where: eq(schema.users.email, 'alex.wilson@techcorp.com'),
  });
  if (!learner1 || !learner2 || !learner3) throw new Error('Learners not found. Run db:seed first.');

  console.log('  ✓ Found agency, tenant, and 5 users\n');

  // 2. Idempotency: delete existing LeaderShift if found
  const existing = await db.query.programs.findFirst({
    where: and(
      eq(schema.programs.name, 'LeaderShift'),
      eq(schema.programs.tenantId, tenant.id)
    ),
  });
  if (existing) {
    console.log('  ⚠ Existing LeaderShift program found — deleting...');
    await db.delete(schema.programs).where(eq(schema.programs.id, existing.id));
    console.log('  ✓ Deleted existing program (cascaded modules/lessons/enrollments)\n');
  }

  // 3. Create program
  console.log('Creating LeaderShift program...');
  const [program] = await db
    .insert(schema.programs)
    .values({
      tenantId: tenant.id,
      agencyId: agency.id,
      name: 'LeaderShift',
      internalName: 'LS-2026-Q1',
      description:
        'A comprehensive leadership transformation program that develops core leadership competencies through video content, peer discussions, goal setting, coaching sessions, and practical application. The program covers self-awareness, communication, team leadership, performance planning, and strategic thinking.',
      type: 'cohort',
      status: 'active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-08-31'),
      timezone: 'America/New_York',
      config: {
        sequentialAccess: true,
        trackInScorecard: true,
        issueCertificate: true,
        requireMentor: true,
      },
      createdBy: facilitator.id,
    })
    .returning();

  console.log(`  ✓ Program created: ${program.name} (${program.id})\n`);

  // 4. Create modules and lessons
  console.log('Creating modules and lessons...');

  // ──────────────────────────────────────────────
  // MODULE 0: Introduction to the Results Tracking Platform
  // (Restructured: 1 lesson + 2 tasks instead of 3 separate lessons)
  // ──────────────────────────────────────────────
  const { lessons: lessons0 } = await createModuleWithLessons(
    program.id,
    {
      title: 'Introduction to the Results Tracking Platform',
      description: 'Get started with the platform and set up your profile.',
      order: 0,
      dripType: 'immediate',
    },
    [
      {
        title: 'Welcome to the Results Tracking Platform',
        contentType: 'lesson',
        durationMinutes: 15,
        points: 5,
        content: {
          introduction:
            'Welcome! We are excited that you have chosen to continue your leadership journey with us. The learning transfer platform makes your training a process rather than just an event.',
          mainContent:
            '<p>Here you will find the tasks to be done before, during and after the training sessions. You will be supported along the way by program facilitators and your coach.</p><p>We will be supporting this learning journey using this platform. If you are new, we recommend watching the short orientation tutorials.</p><p>Complete the tasks below to get started.</p>',
        },
        tasks: [
          {
            title: 'Upload Your Profile Picture',
            description: 'Upload a professional profile picture to your account. Navigate to Settings from the main menu to upload your photo.',
            responseType: 'completion_click',
            approvalRequired: 'facilitator',
            points: 5,
          },
          {
            title: 'Watch the "Get Started" Video',
            description: 'Watch the platform orientation video to learn how to navigate the platform, complete lessons, and track your progress.',
            responseType: 'completion_click',
            approvalRequired: 'none',
            points: 5,
          },
        ],
      },
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 1: Pre-Work — Welcome to LeaderShift!
  // ──────────────────────────────────────────────
  const { lessons: lessons1 } = await createModuleWithLessons(
    program.id,
    {
      title: 'Welcome to LeaderShift!',
      description: 'Complete your pre-work before the first session. Includes assessments, DISC introduction, and reflection exercises.',
      order: 1,
      dripType: 'immediate',
    },
    [
      {
        title: 'Welcome to LeaderShift!',
        contentType: 'lesson',
        durationMinutes: 15,
        points: 10,
        content: {
          introduction: 'Take a few minutes to watch this short introduction video.',
          videoUrl: 'https://player.vimeo.com/video/910093966',
          mainContent:
            '<p>In this program, you will develop essential leadership skills through video content, coaching sessions, goal setting, and peer discussions. Each module builds on the previous one.</p>',
        },
        tasks: [
          {
            title: 'Complete Your Talent Insights Assessment',
            description: 'The Talent Insights Assessment will give you significant insight into your natural behavior style and what motivates you. The resulting report will be emailed to you automatically.',
            responseType: 'completion_click',
            approvalRequired: 'facilitator',
            points: 5,
          },
        ],
      },
      {
        title: 'Challenges & Frustrations Worksheet',
        contentType: 'assignment',
        durationMinutes: 30,
        points: 15,
        content: {
          instructions:
            'Download, print and complete the Challenges and Frustrations Worksheet. Reflect on your current leadership challenges and areas where you would like to grow. Make sure you bring your completed sheet to your next meeting.',
          questions: [
            'What are your top 3 leadership challenges right now?',
            'What frustrations do you experience in your current role?',
            'What would success look like for you at the end of this program?',
          ],
          submissionTypes: ['text'],
        },
      },
      {
        title: 'An Introduction to DISC',
        contentType: 'lesson',
        durationMinutes: 20,
        points: 10,
        content: {
          introduction:
            'The following modules are designed to help you understand your DISC report prior to your live debrief with your coach. The challenge is that when most people take the DISC assessment they get a very one-dimensional view of their report.',
          videoUrl: 'https://player.vimeo.com/video/948880657',
          mainContent:
            '<p>The DISC model categorizes behavioral styles into four primary types:</p><ul><li><strong>D - Dominance (Red):</strong> Direct, results-oriented, strong-willed</li><li><strong>I - Influence (Yellow):</strong> Outgoing, enthusiastic, optimistic</li><li><strong>S - Steadiness (Green):</strong> Even-tempered, patient, accommodating</li><li><strong>C - Conscientiousness (Blue):</strong> Analytical, reserved, precise</li></ul>',
        },
      },
      {
        title: 'Understanding the DISC Model',
        contentType: 'lesson',
        durationMinutes: 20,
        points: 10,
        content: {
          introduction: 'Take a deeper dive into the DISC model and learn how to apply it to improve your leadership effectiveness and team communication.',
          videoUrl: 'https://player.vimeo.com/video/948880634',
          mainContent:
            '<p>Understanding your own DISC profile — and the profiles of those you work with — is a powerful leadership tool. In this lesson, you will learn how different styles interact and how to adapt your approach.</p>',
        },
      },
      {
        title: 'DISC Report Insights',
        contentType: 'text_form',
        durationMinutes: 15,
        points: 10,
        content: {
          formPrompt:
            'Share with your fellow participants:\n1. Your primary behavioral style — Red, Yellow, Green or Blue (the highest plotting point on your Natural Style Graph, page 6 of your report).\n2. After reviewing your report, what is one insight that you feel could help you communicate more effectively?',
          minLength: 100,
          enableDiscussion: true,
        },
      },
      {
        title: 'Bonus Resources',
        contentType: 'lesson',
        durationMinutes: 15,
        points: 5,
        content: {
          introduction: 'We have included a number of additional videos that will help you learn more about each of the four behavioral styles.',
          mainContent:
            '<p>Explore these bonus resources at your own pace. Each video introduces one of the four DISC behavioral styles in detail.</p>',
          resources: [
            { title: 'Getting to Know High Blue (High C)', url: 'https://player.vimeo.com/video/948880680', type: 'video' },
            { title: 'Getting to Know the Green (High S)', url: 'https://player.vimeo.com/video/948880670', type: 'video' },
            { title: 'Getting to Know the Red (High D)', url: 'https://player.vimeo.com/video/948880690', type: 'video' },
            { title: 'Getting to Know the Yellow (High I)', url: 'https://player.vimeo.com/video/948880700', type: 'video' },
          ],
        },
      },
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 2: Milestone — Ready for First Meeting
  // ──────────────────────────────────────────────
  const { lessons: lessons2 } = await createModuleWithLessons(
    program.id,
    {
      title: "Milestone: You're Ready for Your First Meeting!",
      description: 'Prepare for your kickoff session, review resources, and set your initial leadership goals.',
      order: 2,
      dripType: 'days_after_previous',
      dripValue: 7,
    },
    [
      {
        title: 'Pre-Meeting Checklist',
        contentType: 'lesson',
        durationMinutes: 10,
        points: 5,
        content: {
          introduction: 'Here is a checklist of what you will need to make sure you are prepared for your first meeting.',
          mainContent:
            '<p><strong>Meeting Preparation Checklist:</strong></p><ul><li>Downloaded and completed the Challenges and Frustrations Worksheet</li><li>Completed your Talent Insights Assessment</li><li>Printed your assessment results</li><li>Watched the DISC introduction videos</li><li>Shared your DISC insights with peers</li></ul><p>We look forward to seeing you at the kickoff!</p>',
        },
      },
      {
        title: 'Kickoff Resources',
        contentType: 'lesson',
        durationMinutes: 30,
        points: 10,
        content: {
          introduction: 'The included videos will help you understand the foundational concepts that we will utilize in the program. Many of them are covered in the kickoff session.',
          mainContent:
            '<p>Review these key concept videos:</p><ol><li>How to view your problems/challenges and change everything</li><li>Leadership & The Ceiling of Complexity</li><li>Understanding Your Roles as a Leader</li><li>The Accountability Support Matrix</li><li>Circle of Influence / Circle of Concern</li><li>Learn Defend Choice</li><li>Management by the Ideal</li><li>Charting the Course</li></ol>',
          videoUrl: 'https://player.vimeo.com/video/910101196',
        },
      },
      {
        title: 'Program Kickoff Session',
        contentType: 'assignment',
        durationMinutes: 90,
        points: 20,
        approvalRequired: 'mentor',
        content: {
          agenda: 'First meeting to kick off the LeaderShift program. Review pre-work, discuss DISC results, and begin goal setting.',
          discussionQuestions: [
            'Share your DISC profile highlights and what you learned',
            'Discuss your Challenges & Frustrations Worksheet',
            'What are your top priorities for development?',
            'What does success look like at the end of this program?',
            'Agree on communication preferences and meeting cadence',
          ],
          preparationInstructions: 'Come prepared with your completed pre-work materials, DISC report, and initial thoughts on your leadership goals.',
        },
      },
      {
        title: 'Leadership Development Goal #1',
        contentType: 'goal',
        durationMinutes: 20,
        points: 15,
        content: {
          goalPrompt:
            'Enter your first Leadership Development Goal. Review the results of your Leadership Self Assessment with your mentor so that your goals are aligned with their expectations for the program.',
          requireMetrics: true,
          requireActionSteps: true,
        },
      },
      {
        title: 'Leadership Development Goal #2',
        contentType: 'goal',
        durationMinutes: 15,
        points: 15,
        content: {
          goalPrompt: 'Enter your second Leadership Development Goal focused on communication, relationships, or a skill area identified in your assessment.',
          requireMetrics: true,
          requireActionSteps: true,
        },
      },
      {
        title: 'Leadership Development Goal #3',
        contentType: 'goal',
        durationMinutes: 15,
        points: 15,
        content: {
          goalPrompt: 'Enter your third Leadership Development Goal. This could be related to personal growth, team development, or organizational impact.',
          requireMetrics: true,
          requireActionSteps: true,
        },
      },
      {
        title: 'Manager Review',
        contentType: 'assignment',
        durationMinutes: 15,
        points: 10,
        approvalRequired: 'mentor',
        content: {
          instructions: 'Your coach/mentor will review your three goals and provide feedback to ensure they are well-formed and aligned with expectations for the program.',
          formPrompt: 'Summarize your three leadership development goals and any questions or concerns you have.',
        },
      },
    ]
  );

  // ──────────────────────────────────────────────
  // EVENT: Program Kickoff (between Module 2 and Module 3)
  // ──────────────────────────────────────────────
  await createEvent(program.id, {
    title: 'Program Kickoff',
    description: 'First session to kick off the LeaderShift program. Review pre-work, discuss DISC results, and begin goal setting.',
    order: 3,
    eventConfig: {
      date: '2026-03-15',
      startTime: '09:00',
      endTime: '12:00',
      timezone: 'America/New_York',
      location: 'Virtual',
      zoomLink: 'https://zoom.us/j/1234567890',
      meetingId: '123 456 7890',
      meetingPassword: 'leadershift',
      description: '<p><strong>Meeting Preparation:</strong></p><ul><li>Downloaded and completed the Challenges and Frustrations Worksheet</li><li>Completed your Talent Insights Assessment</li><li>Printed your assessment results</li><li>Watched the DISC introduction videos</li><li>Shared your DISC insights with peers</li></ul><p>We look forward to seeing you at the kickoff!</p>',
      videoUrl: 'https://player.vimeo.com/video/910101196',
    },
  });

  // ──────────────────────────────────────────────
  // MODULE 3: The Leader and The Manager
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'The Leader and The Manager',
      description: 'Explore the difference between leadership and management, vision and goal setting, and qualities of leadership.',
      order: 4,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: The Leader and The Manager',
        'In this video we discuss beginning first with the end in mind. How would you like your team to be different after you complete the LeaderShift Program?',
        'https://player.vimeo.com/video/948391797',
        '<p>Leadership and management are not the same thing, but both are necessary. Leaders inspire vision and direction. Managers ensure execution and consistency. The best leaders know when to switch between these two modes.</p>'
      ),
      videoLesson(
        'Video: Vision and Goals',
        'In this video, we will discuss the power of Vision and how it directly relates to the goals you set.',
        'https://player.vimeo.com/video/948396986',
        '<p>A clear vision gives your team direction and purpose. Goals break that vision down into achievable milestones.</p>'
      ),
      videoLesson(
        'Video: Qualities of Leadership',
        'After listening to the video, what qualities do you feel are a strength and which ones are your biggest opportunity for development?',
        'https://player.vimeo.com/video/948399430',
        '<p>Great leadership is built on a foundation of character, competence, and connection. This lesson examines the qualities that define exceptional leaders.</p>'
      ),
      mostUsefulIdeaLesson(),
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 4: Leading Yourself
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Leading Yourself',
      description: 'Master self-leadership through effective time management, overcoming roadblocks, and identifying high-payoff activities.',
      order: 5,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Time As A Resource',
        'Analyze your own behavior in relation to your high-payoff activities and establish specific goals for improvement.',
        'https://player.vimeo.com/video/948747767',
        '<p>Time is your most valuable and non-renewable resource. As a leader, how you spend your time sends a powerful message to your team about what matters most.</p>'
      ),
      videoLesson(
        'Video: The Truth About Time',
        'Plan your daily, weekly and monthly activities based upon your goals. Be able to maintain focus, manage stress and balance life.',
        'https://player.vimeo.com/video/948747730',
        '<p>Most leaders are surprised when they track how they actually spend their time. Understanding the gap between perception and reality is the first step to better time management.</p>'
      ),
      videoLesson(
        'Video: The Path Forward',
        'Use organization and technology to save time. Learn practical strategies for making better use of every hour.',
        'https://player.vimeo.com/video/948747703',
        '<p>This lesson provides a practical framework for restructuring how you spend your time to focus on what matters most for your leadership.</p>'
      ),
      videoLesson(
        'Video: Roadblocks and Obstacles',
        'Learn to identify, anticipate, and overcome the obstacles that stand between you and your goals.',
        'https://player.vimeo.com/video/948747703',
        '<p>Roadblocks are inevitable, but how you respond to them defines your leadership. This lesson teaches you strategies for navigating common obstacles.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'High Payoff Activities',
        contentType: 'text_form',
        durationMinutes: 15,
        points: 10,
        content: {
          formPrompt:
            'Identify your top 3 High Payoff Activities (HPAs) — the activities that produce the greatest results relative to the time invested. For each, describe: (1) what the activity is, (2) why it is high payoff, and (3) how much time you currently dedicate to it versus how much you should.',
          minLength: 100,
          enableDiscussion: true,
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 5: Planning Performance
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Planning Performance',
      description: 'Learn how to plan for and manage team performance. Create position scorecards and practice performance planning skills.',
      order: 6,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Planning Performance',
        'Learn the essential framework for setting expectations, measuring results, and driving continuous improvement.',
        'https://player.vimeo.com/video/948754156',
        '<p>Performance planning is the foundation of effective leadership. Without clear expectations and measurement, teams drift.</p>'
      ),
      {
        title: 'Create Your Position Scorecard',
        contentType: 'assignment',
        durationMinutes: 45,
        points: 20,
        content: {
          instructions:
            'Enter the following prompt into your favorite AI Agent:\n\nCreate a scorecard for <enter name of the position here> of a <enter the type of company here> company that includes key performance indicators, key accountabilities and competencies required to be an A player as described by Smart and Company. The company <enter a general description of what the company does>. Create a PDF of the scorecard.\n\nOnce you have created your Position Scorecard, email it to your mentor and facilitator.',
          questions: [
            'What position did you create the scorecard for?',
            'What were the key performance indicators?',
            'What key competencies were identified?',
          ],
          submissionTypes: ['text', 'file_upload'],
          allowedFileTypes: ['.pdf', '.docx', '.xlsx'],
        },
      },
      mostUsefulIdeaLesson(),
      {
        title: 'Planning Performance Skill Practice',
        contentType: 'assignment',
        durationMinutes: 5,
        points: 10,
        approvalRequired: 'facilitator',
        content: {
          instructions: 'I was able to complete the Planning Performance Skill Practice. Click "Finish" to confirm completion.',
        },
      },
      {
        title: 'What went well in your coaching session?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Reflect on your coaching session for this module. What went well?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      {
        title: 'What would you do differently next time?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Looking back at your coaching session, what would you do differently next time? What adjustments will you make going forward?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // EVENT: MidPoint Session (between Module 5 and Module 6)
  // ──────────────────────────────────────────────
  await createEvent(program.id, {
    title: 'MidPoint Session',
    description: 'Mid-program group session. Review progress, share learnings, and recalibrate goals for the second half.',
    order: 7,
    eventConfig: {
      date: '2026-05-15',
      startTime: '09:00',
      endTime: '12:00',
      timezone: 'America/New_York',
      location: 'Virtual',
      zoomLink: 'https://zoom.us/j/1234567891',
      meetingId: '123 456 7891',
      description: '<p>This is the mid-program check-in session. Come prepared to share your progress, wins, and challenges from the first half of the program.</p><p><strong>Agenda:</strong></p><ul><li>Progress review and reflection</li><li>Peer learning exchange</li><li>Goal recalibration</li><li>Introduction to coaching for improved performance</li></ul>',
    },
  });

  // ──────────────────────────────────────────────
  // MODULE 6: MidPoint Session — Coaching For Improved Performance
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'MidPoint Session: Coaching For Improved Performance',
      description: 'Mid-program checkpoint. Complete your mid-term assessment and learn coaching for improved performance.',
      order: 8,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      {
        title: 'Mid-Term Self Assessment',
        contentType: 'assignment',
        durationMinutes: 15,
        points: 15,
        approvalRequired: 'facilitator',
        content: {
          instructions:
            'The Mid Term Self Assessment is designed to allow you to assess where you have made progress and identify the areas you would like to focus on for the remainder of the program. Download and complete the assessment, then click "Finish".',
        },
      },
      videoLesson(
        'Video: Coaching For Improved Performance',
        'After completing this module, you will be able to: demonstrate a Coaching Feedback for Improved Performance process, identify motivators for team members, and practice five strategies for communicating more effectively.',
        'https://player.vimeo.com/video/948757060',
        '<p>Coaching is one of the most powerful tools a leader has for improving performance. In this lesson, you will learn a structured approach to coaching conversations that drive real results.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'Coaching To Improve Performance Skill Practice',
        contentType: 'assignment',
        durationMinutes: 5,
        points: 10,
        approvalRequired: 'facilitator',
        content: {
          instructions: 'I was able to complete the Coaching To Improve Performance Skill Practice. Click "Finish" to confirm.',
        },
      },
      {
        title: 'What went well in your coaching session?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Reflect on your coaching session for this module. What went well?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      {
        title: 'What would you do differently next time?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Looking back at your coaching session, what would you do differently next time? What adjustments will you make going forward?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 7: Coaching For Development
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Coaching For Development',
      description: 'Learn coaching for long-term development, training, career coaching, and the Stockdale Paradox for resilient leadership.',
      order: 9,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Coaching For Development',
        'After completing this module, you will be able to: practice two aspects of Coaching for Development — training and coaching for career development. Demonstrate effective positive feedback and recognition.',
        'https://player.vimeo.com/video/948758472',
        '<p>Development coaching focuses on the long-term growth of your team members. While performance coaching addresses current gaps, development coaching builds future capability.</p>'
      ),
      videoLesson(
        'Video: The Stockdale Paradox',
        'Discover the Stockdale Paradox — a powerful mental model for maintaining hope while confronting brutal reality.',
        'https://player.vimeo.com/video/948758460',
        '<p>The Stockdale Paradox teaches us to confront the most brutal facts of our current reality while never losing faith that we will prevail in the end. This is at the heart of resilient leadership.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'Identifying Motivators Skill Practice',
        contentType: 'assignment',
        durationMinutes: 10,
        points: 10,
        approvalRequired: 'facilitator',
        content: {
          instructions: 'I was able to complete the Identifying Motivators Skill Practice. Practice identifying what motivates each of your direct reports. Click "Finish" to confirm.',
        },
      },
      {
        title: 'What went well in your coaching session?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Reflect on your coaching session for this module. What went well?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      {
        title: 'What would you do differently next time?',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt: 'Looking back at your coaching session, what would you do differently next time? What adjustments will you make going forward?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 8: Leading A Team
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Leading A Team',
      description: 'Develop skills to lead high-performing teams through delegation, communication, and meeting strategies.',
      order: 10,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Leading A Team',
        'After completing this module, you will be able to: define and apply appropriate levels of authority and responsibility when delegating, develop delegation plans, and demonstrate effective meeting and communication strategies.',
        'https://player.vimeo.com/video/948748732',
        '<p>Leading a team requires building trust, setting clear expectations, and fostering accountability. This lesson covers delegation, empowerment, and presentation skills.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'Food For Thought',
        contentType: 'text_form',
        durationMinutes: 10,
        points: 10,
        content: {
          formPrompt:
            'Reflect on the content from this module on Leading A Team. What concept or idea stood out to you the most? How will you apply it with your team?',
          minLength: 50,
          enableDiscussion: true,
        },
      },
      {
        title: 'How will this benefit the person, team and you?',
        contentType: 'text_form',
        durationMinutes: 15,
        points: 10,
        content: {
          formPrompt:
            'Identify a responsibility or task that you will delegate this week. Who will you delegate it to? How will this benefit the person, the team, and you?',
          minLength: 75,
          enableDiscussion: true,
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // MODULE 9: Counseling and Corrective Action
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Counseling and Corrective Action',
      description: 'Learn to handle difficult conversations, define performance standards, and demonstrate a skill process for corrective action.',
      order: 11,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Counseling and Corrective Action',
        'After completing this module, you will be able to: define and communicate performance and behavior standards, define the difference between behavior and performance problems, demonstrate a skill process for corrective action, and intervene when personal problems affect job performance.',
        'https://player.vimeo.com/video/948776006',
        '<p>Corrective action is not about punishment — it is about helping people get back on track. Learn a structured approach to counseling conversations that maintains dignity while driving accountability.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'Food For Thought',
        contentType: 'assignment',
        durationMinutes: 5,
        points: 10,
        approvalRequired: 'facilitator',
        content: {
          instructions: 'There are a number of assignments in the back of this section of the participant manual. Complete the Food For Thought exercises and click "Finish" to confirm.',
        },
      },
      coachMeetingLesson(),
    ]
  );

  // ──────────────────────────────────────────────
  // EVENT: Final Session (between Module 9 and Module 10)
  // ──────────────────────────────────────────────
  await createEvent(program.id, {
    title: 'Final Session',
    description: 'Closing session to celebrate growth, share key learnings, and plan for continued leadership development.',
    order: 12,
    eventConfig: {
      date: '2026-08-15',
      startTime: '09:00',
      endTime: '12:00',
      timezone: 'America/New_York',
      location: 'Virtual',
      zoomLink: 'https://zoom.us/j/1234567892',
      meetingId: '123 456 7892',
      description: '<p>This is the final celebration session. Come prepared to share your leadership transformation story.</p><p><strong>Agenda:</strong></p><ul><li>Leadership growth reflections</li><li>Celebration letters sharing</li><li>Goal achievement review</li><li>Commitment to continued development</li><li>Certificate presentation</li></ul>',
    },
  });

  // ──────────────────────────────────────────────
  // MODULE 10: Final Session — Leadership Thinking
  // ──────────────────────────────────────────────
  await createModuleWithLessons(
    program.id,
    {
      title: 'Final Session: Leadership Thinking',
      description: 'Develop strategic thinking skills, reflect on your entire journey, and celebrate your leadership transformation.',
      order: 13,
      dripType: 'days_after_previous',
      dripValue: 14,
    },
    [
      actionStepLesson(),
      videoLesson(
        'Video: Leadership Thinking',
        'After completing this module, you will be able to: evaluate situations and identify existing problems and opportunities, involve the team in problem solving and decision making, and identify actions to support and facilitate change.',
        'https://player.vimeo.com/video/948760115',
        '<p>Leadership thinking goes beyond day-to-day management. It is about developing the mental models and decision-making frameworks that allow you to lead with vision and purpose.</p>'
      ),
      mostUsefulIdeaLesson(),
      {
        title: 'Skill Process For Problem Solving',
        contentType: 'text_form',
        durationMinutes: 15,
        points: 10,
        content: {
          formPrompt:
            'Describe a complex problem you are currently facing in your leadership role. How would you apply the leadership thinking frameworks from this lesson to approach it differently?',
          minLength: 100,
          enableDiscussion: true,
        },
      },
      {
        title: 'Decision Making',
        contentType: 'text_form',
        durationMinutes: 15,
        points: 10,
        content: {
          formPrompt:
            'Think about a recent important decision you made as a leader. Evaluate your decision-making process: What information did you consider? Who did you consult? What biases might have influenced you?',
          minLength: 100,
          enableDiscussion: true,
        },
      },
      {
        ...coachMeetingLesson(),
        content: {
          instructions:
            'After your final coaching meeting, summarize your overall experience and key takeaways from the entire LeaderShift program. Your coach will review and confirm.',
          formPrompt:
            'Summarize your key takeaways from the entire LeaderShift program and your plan for continued leadership development.',
        },
      },
      {
        title: 'Write Your Celebration Letter',
        contentType: 'text_form',
        durationMinutes: 20,
        points: 15,
        content: {
          formPrompt:
            'Write a letter to yourself celebrating your growth throughout the LeaderShift program. Reflect on where you started, what you have learned, how you have changed, and where you are headed. Acknowledge your achievements and share this with your peers as a celebration of your collective journey.',
          minLength: 200,
          enableDiscussion: true,
        },
      },
    ]
  );

  console.log('\n  ✓ All modules and lessons created!\n');

  // 5. Create enrollments
  console.log('Creating enrollments...');

  const [_facilEnrollment] = await db
    .insert(schema.enrollments)
    .values({
      programId: program.id,
      userId: facilitator.id,
      tenantId: tenant.id,
      role: 'facilitator',
      status: 'active',
    })
    .returning();
  console.log(`  ✓ Enrolled ${facilitator.email} as facilitator`);

  const [_mentorEnrollment] = await db
    .insert(schema.enrollments)
    .values({
      programId: program.id,
      userId: mentor.id,
      tenantId: tenant.id,
      role: 'mentor',
      status: 'active',
    })
    .returning();
  console.log(`  ✓ Enrolled ${mentor.email} as mentor`);

  const learners = [learner1, learner2, learner3];
  const learnerEnrollments = [];
  for (const learner of learners) {
    const [enrollment] = await db
      .insert(schema.enrollments)
      .values({
        programId: program.id,
        userId: learner.id,
        tenantId: tenant.id,
        role: 'learner',
        status: 'active',
        progress: 0,
      })
      .returning();
    learnerEnrollments.push(enrollment);
    console.log(`  ✓ Enrolled ${learner.email} as learner`);
  }

  // 6b. Seed John Doe's progress (modules 0 + 1 complete, module 2 in-progress)
  console.log('\nSeeding John Doe lesson progress...');
  const johnEnrollment = learnerEnrollments[0]; // learner1 = john.doe@techcorp.com
  const completedLessonList = [...lessons0, ...lessons1, ...lessons2.slice(0, 3)];
  const inProgressLesson = lessons2[3];
  const progressNow = new Date();

  await db.insert(schema.lessonProgress).values([
    ...completedLessonList.map((lesson) => ({
      enrollmentId: johnEnrollment.id,
      lessonId: lesson.id,
      status: 'completed' as const,
      startedAt: progressNow,
      completedAt: progressNow,
      pointsEarned: lesson.points,
    })),
    {
      enrollmentId: johnEnrollment.id,
      lessonId: inProgressLesson.id,
      status: 'in_progress' as const,
      startedAt: progressNow,
      pointsEarned: 0,
    },
  ]);

  const completedPts = completedLessonList.reduce((s, l) => s + l.points, 0);
  // ~14% overall (10 of ~73 total lessons)
  await db
    .update(schema.enrollments)
    .set({ progress: 14, pointsEarned: completedPts })
    .where(eq(schema.enrollments.id, johnEnrollment.id));

  console.log(`  ✓ John Doe: ${completedLessonList.length} lessons complete, module 2 in-progress (${completedPts} pts)`);

  // 6. Create mentorships
  console.log('\nCreating mentor assignments...');
  for (const enrollment of learnerEnrollments) {
    await db.insert(schema.enrollmentMentorships).values({
      enrollmentId: enrollment.id,
      mentorUserId: mentor.id,
      programId: program.id,
    });
  }
  console.log(`  ✓ Assigned ${mentor.email} as mentor to all 3 learners`);

  console.log('\n🎉 LeaderShift program seeded successfully!');
  console.log(`   Program: ${program.name} (${program.id})`);
  console.log(`   Modules: 11 + 3 events`);
  console.log(`   Enrollments: 5 (1 facilitator, 1 mentor, 3 learners)\n`);
}

seedLeaderShift()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });

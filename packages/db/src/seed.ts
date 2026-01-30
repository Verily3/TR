import { db } from "./client";
import {
  agencies,
  tenants,
  users,
  agencyMembers,
  tenantMembers,
  programs,
  modules,
  lessons,
  enrollments,
  goals,
  goalMilestones,
  scorecards,
  kpis,
  coachingRelationships,
  announcements,
  pricingPlans,
  assessmentTemplates,
} from "./schema";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ============================================================================
  // 0. CLEANUP EXISTING DATA
  // ============================================================================
  console.log("Cleaning up existing data...");
  await db.delete(assessmentTemplates);
  await db.delete(announcements);
  await db.delete(coachingRelationships);
  await db.delete(goalMilestones);
  await db.delete(goals);
  await db.delete(kpis);
  await db.delete(scorecards);
  await db.delete(enrollments);
  await db.delete(lessons);
  await db.delete(modules);
  await db.delete(programs);
  await db.delete(tenantMembers);
  await db.delete(agencyMembers);
  await db.delete(users);
  await db.delete(tenants);
  await db.delete(pricingPlans);
  await db.delete(agencies);
  console.log("✓ Cleanup complete\n");

  // ============================================================================
  // 1. CREATE AGENCY
  // ============================================================================
  console.log("Creating agency...");
  const [agency] = await db
    .insert(agencies)
    .values({
      name: "Transformation Partners",
      slug: "transformation-partners",
      domain: "transformationpartners.com",
      settings: {
        allowCustomBranding: true,
        maxTenants: 100,
      },
    })
    .returning();
  console.log(`✓ Agency created: ${agency.name} (${agency.id})\n`);

  // ============================================================================
  // 2. CREATE PRICING PLANS
  // ============================================================================
  console.log("Creating pricing plans...");
  const [starterPlan] = await db
    .insert(pricingPlans)
    .values({
      agencyId: agency.id,
      name: "Starter",
      description: "Perfect for small teams getting started",
      basePrice: "49.00",
      billingInterval: "monthly",
      includedSeats: 10,
      pricePerSeat: "5.00",
      maxUsers: 25,
      maxPrograms: 5,
      features: [
        { name: "Programs", limit: 5 },
        { name: "Storage", limit: "5GB" },
        { name: "Support", type: "email" },
      ],
      trialDays: 14,
      displayOrder: 1,
    })
    .returning();

  const [proPlan] = await db
    .insert(pricingPlans)
    .values({
      agencyId: agency.id,
      name: "Professional",
      description: "For growing organizations",
      basePrice: "149.00",
      billingInterval: "monthly",
      includedSeats: 50,
      pricePerSeat: "3.00",
      maxUsers: 200,
      maxPrograms: 25,
      features: [
        { name: "Programs", limit: 25 },
        { name: "Storage", limit: "50GB" },
        { name: "Support", type: "priority" },
        { name: "Custom Branding", included: true },
        { name: "API Access", included: true },
      ],
      trialDays: 14,
      displayOrder: 2,
    })
    .returning();
  console.log(`✓ Pricing plans created: ${starterPlan.name}, ${proPlan.name}\n`);

  // ============================================================================
  // 3. CREATE TENANT
  // ============================================================================
  console.log("Creating tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({
      agencyId: agency.id,
      name: "Acme Corporation",
      slug: "acme-corp",
      settings: {
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
      },
    })
    .returning();
  console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})\n`);

  // ============================================================================
  // 4. CREATE USERS
  // ============================================================================
  console.log("Creating users...");

  // Admin user
  const [adminUser] = await db
    .insert(users)
    .values({
      firebaseUid: "admin-firebase-uid-placeholder",
      email: "admin@acme.com",
      firstName: "Sarah",
      lastName: "Johnson",
      emailVerified: true,
      timezone: "America/New_York",
    })
    .returning();

  // Regular users
  const [user1] = await db
    .insert(users)
    .values({
      firebaseUid: "user1-firebase-uid-placeholder",
      email: "john.doe@acme.com",
      firstName: "John",
      lastName: "Doe",
      emailVerified: true,
      timezone: "America/New_York",
    })
    .returning();

  const [user2] = await db
    .insert(users)
    .values({
      firebaseUid: "user2-firebase-uid-placeholder",
      email: "jane.smith@acme.com",
      firstName: "Jane",
      lastName: "Smith",
      emailVerified: true,
      timezone: "America/New_York",
    })
    .returning();

  const [coach] = await db
    .insert(users)
    .values({
      firebaseUid: "coach-firebase-uid-placeholder",
      email: "coach@acme.com",
      firstName: "Michael",
      lastName: "Chen",
      emailVerified: true,
      timezone: "America/New_York",
    })
    .returning();

  console.log(`✓ Users created: ${adminUser.email}, ${user1.email}, ${user2.email}, ${coach.email}\n`);

  // ============================================================================
  // 5. CREATE MEMBERSHIPS
  // ============================================================================
  console.log("Creating memberships...");

  // Agency membership (admin)
  await db.insert(agencyMembers).values({
    agencyId: agency.id,
    userId: adminUser.id,
    role: "owner",
  });

  // Tenant memberships
  await db.insert(tenantMembers).values([
    { tenantId: tenant.id, userId: adminUser.id, role: "admin" },
    { tenantId: tenant.id, userId: user1.id, role: "user" },
    { tenantId: tenant.id, userId: user2.id, role: "user" },
    { tenantId: tenant.id, userId: coach.id, role: "admin" },
  ]);
  console.log("✓ Memberships created\n");

  // ============================================================================
  // 6. CREATE PROGRAM
  // ============================================================================
  console.log("Creating program...");
  const [program] = await db
    .insert(programs)
    .values({
      tenantId: tenant.id,
      name: "Leadership Excellence Program",
      description: "A comprehensive 12-week program designed to develop essential leadership skills for emerging leaders.",
      type: "cohort",
      status: "published",
      scheduleType: "fixed",
      createdById: adminUser.id,
      settings: {
        allowSelfEnrollment: false,
        requireApproval: true,
      },
    })
    .returning();
  console.log(`✓ Program created: ${program.name}\n`);

  // ============================================================================
  // 7. CREATE MODULES AND LESSONS
  // ============================================================================
  console.log("Creating modules and lessons...");

  // Module 1
  const [module1] = await db
    .insert(modules)
    .values({
      programId: program.id,
      name: "Foundations of Leadership",
      description: "Understanding what makes an effective leader",
      orderIndex: 0,
    })
    .returning();

  await db.insert(lessons).values([
    {
      moduleId: module1.id,
      name: "What is Leadership?",
      description: "Explore the core concepts and definitions of leadership",
      type: "reading",
      content: {
        body: "Leadership is the ability to guide, inspire, and influence others toward achieving a common goal...",
      },
      estimatedMinutes: 15,
      orderIndex: 0,
    },
    {
      moduleId: module1.id,
      name: "Leadership Styles",
      description: "Learn about different leadership styles and when to apply them",
      type: "video",
      content: {
        videoUrl: "https://example.com/video1",
        transcript: "In this video, we explore various leadership styles...",
      },
      estimatedMinutes: 25,
      orderIndex: 1,
    },
    {
      moduleId: module1.id,
      name: "Self-Assessment",
      description: "Reflect on your current leadership capabilities",
      type: "reflection",
      content: {
        questions: [
          "What leadership qualities do you currently possess?",
          "What areas would you like to develop?",
          "Describe a situation where you demonstrated leadership.",
        ],
      },
      estimatedMinutes: 20,
      orderIndex: 2,
    },
  ]);

  // Module 2
  const [module2] = await db
    .insert(modules)
    .values({
      programId: program.id,
      name: "Communication Skills",
      description: "Master the art of effective communication",
      orderIndex: 1,
    })
    .returning();

  await db.insert(lessons).values([
    {
      moduleId: module2.id,
      name: "Active Listening",
      description: "Learn techniques for becoming a better listener",
      type: "reading",
      content: {
        body: "Active listening is a communication technique that involves fully concentrating on what is being said...",
      },
      estimatedMinutes: 15,
      orderIndex: 0,
    },
    {
      moduleId: module2.id,
      name: "Giving Feedback",
      description: "How to deliver constructive feedback effectively",
      type: "video",
      content: {
        videoUrl: "https://example.com/video2",
      },
      estimatedMinutes: 20,
      orderIndex: 1,
    },
  ]);

  console.log(`✓ Created 2 modules with 5 lessons\n`);

  // ============================================================================
  // 8. CREATE ENROLLMENTS
  // ============================================================================
  console.log("Creating enrollments...");
  await db.insert(enrollments).values([
    {
      programId: program.id,
      userId: user1.id,
      role: "participant",
      status: "active",
      progress: 40,
    },
    {
      programId: program.id,
      userId: user2.id,
      role: "participant",
      status: "active",
      progress: 20,
    },
    {
      programId: program.id,
      userId: coach.id,
      role: "facilitator",
      status: "active",
    },
  ]);
  console.log("✓ Enrollments created\n");

  // ============================================================================
  // 9. CREATE SCORECARD AND KPIS
  // ============================================================================
  console.log("Creating scorecard and KPIs...");
  const [scorecard] = await db
    .insert(scorecards)
    .values({
      tenantId: tenant.id,
      userId: user1.id,
      roleTitle: "Senior Software Engineer",
      missionStatement: "Drive technical excellence and mentor team members to deliver high-quality software solutions.",
    })
    .returning();

  await db.insert(kpis).values([
    {
      scorecardId: scorecard.id,
      name: "Team Engagement Score",
      description: "Measure of team engagement and satisfaction",
      category: "people_culture",
      targetValue: "85",
      currentValue: "78",
      unit: "%",
      trend: "up",
    },
    {
      scorecardId: scorecard.id,
      name: "Project Delivery Rate",
      description: "Percentage of projects delivered on time",
      category: "operational",
      targetValue: "90",
      currentValue: "85",
      unit: "%",
      trend: "flat",
    },
    {
      scorecardId: scorecard.id,
      name: "Customer Satisfaction",
      description: "NPS score from customer surveys",
      category: "market_growth",
      targetValue: "50",
      currentValue: "45",
      unit: "NPS",
      trend: "up",
    },
  ]);
  console.log("✓ Scorecard and KPIs created\n");

  // ============================================================================
  // 10. CREATE GOALS
  // ============================================================================
  console.log("Creating goals...");
  const [goal1] = await db
    .insert(goals)
    .values({
      tenantId: tenant.id,
      ownerId: user1.id,
      createdById: user1.id,
      title: "Improve team communication effectiveness",
      description: "Implement regular team meetings and improve feedback loops",
      type: "personal",
      status: "active",
      progressStatus: "on_track",
      progress: 35,
      startDate: "2024-01-01",
      targetDate: "2024-03-31",
    })
    .returning();

  await db.insert(goalMilestones).values([
    {
      goalId: goal1.id,
      name: "Establish weekly team meetings",
      description: "Set up recurring weekly team sync meetings",
      orderIndex: 0,
      isCompleted: true,
      completedAt: new Date("2024-01-15T00:00:00.000Z"),
    },
    {
      goalId: goal1.id,
      name: "Implement feedback system",
      description: "Create a structured feedback process",
      orderIndex: 1,
      isCompleted: false,
    },
    {
      goalId: goal1.id,
      name: "Conduct communication training",
      description: "Complete communication skills workshop",
      orderIndex: 2,
      isCompleted: false,
    },
  ]);

  const [goal2] = await db
    .insert(goals)
    .values({
      tenantId: tenant.id,
      ownerId: user1.id,
      createdById: coach.id,
      title: "Complete Leadership Excellence Program",
      description: "Finish all modules and assignments in the leadership program",
      type: "personal",
      status: "active",
      progressStatus: "on_track",
      progress: 40,
      startDate: "2024-01-01",
      targetDate: "2024-04-30",
      programId: program.id,
    })
    .returning();

  console.log(`✓ Goals created with milestones\n`);

  // ============================================================================
  // 11. CREATE COACHING RELATIONSHIP
  // ============================================================================
  console.log("Creating coaching relationship...");
  await db.insert(coachingRelationships).values({
    tenantId: tenant.id,
    coachId: coach.id,
    coacheeId: user1.id,
    relationshipType: "mentor",
    defaultDurationMinutes: 60,
    meetingFrequency: "biweekly",
    preferredDay: "Tuesday",
    preferredTime: "10:00",
  });
  console.log("✓ Coaching relationship created\n");

  // ============================================================================
  // 12. CREATE ANNOUNCEMENT
  // ============================================================================
  console.log("Creating announcement...");
  await db.insert(announcements).values({
    tenantId: tenant.id,
    title: "Welcome to Transformation OS!",
    body: "We're excited to have you on board. This platform will help you track your development goals, complete training programs, and collaborate with your team. If you have any questions, reach out to your administrator.",
    type: "info",
    isPublished: true,
    isPinned: true,
    authorId: adminUser.id,
  });
  console.log("✓ Announcement created\n");

  // ============================================================================
  // 13. CREATE ASSESSMENT TEMPLATES
  // ============================================================================
  console.log("Creating assessment templates...");

  // Leadership 360 Template
  const [leadership360] = await db
    .insert(assessmentTemplates)
    .values({
      agencyId: agency.id,
      name: "Leadership 360",
      description: "Comprehensive 360-degree feedback assessment for leadership competencies",
      type: "360",
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      competencies: [
        {
          id: "comp-1",
          name: "Strategic Thinking",
          description: "Ability to think strategically and plan for the future",
          questions: [
            { id: "q1-1", text: "Develops clear long-term vision and goals" },
            { id: "q1-2", text: "Anticipates future challenges and opportunities" },
            { id: "q1-3", text: "Makes decisions aligned with organizational strategy" },
          ],
        },
        {
          id: "comp-2",
          name: "Communication",
          description: "Effectiveness in conveying information and ideas",
          questions: [
            { id: "q2-1", text: "Communicates clearly and concisely" },
            { id: "q2-2", text: "Listens actively to others' perspectives" },
            { id: "q2-3", text: "Adapts communication style to different audiences" },
            { id: "q2-4", text: "Provides timely and constructive feedback" },
          ],
        },
        {
          id: "comp-3",
          name: "Team Leadership",
          description: "Ability to lead and develop teams effectively",
          questions: [
            { id: "q3-1", text: "Inspires and motivates team members" },
            { id: "q3-2", text: "Delegates effectively and empowers others" },
            { id: "q3-3", text: "Builds a culture of trust and collaboration" },
            { id: "q3-4", text: "Recognizes and develops team members' strengths" },
          ],
        },
        {
          id: "comp-4",
          name: "Decision Making",
          description: "Quality and timeliness of decisions",
          questions: [
            { id: "q4-1", text: "Makes timely decisions even with incomplete information" },
            { id: "q4-2", text: "Considers multiple perspectives before deciding" },
            { id: "q4-3", text: "Takes accountability for decisions and outcomes" },
          ],
        },
        {
          id: "comp-5",
          name: "Emotional Intelligence",
          description: "Self-awareness and management of emotions",
          questions: [
            { id: "q5-1", text: "Demonstrates self-awareness and manages emotions effectively" },
            { id: "q5-2", text: "Shows empathy and understanding towards others" },
            { id: "q5-3", text: "Remains calm and composed under pressure" },
            { id: "q5-4", text: "Builds positive relationships across the organization" },
          ],
        },
      ],
      goalSuggestionRules: [
        {
          competencyId: "comp-1",
          threshold: 3,
          operator: "less_than",
          suggestedGoal: "Develop strategic thinking capabilities through executive coaching",
        },
        {
          competencyId: "comp-2",
          threshold: 3,
          operator: "less_than",
          suggestedGoal: "Improve communication skills through targeted training",
        },
        {
          competencyId: "comp-3",
          threshold: 3,
          operator: "less_than",
          suggestedGoal: "Strengthen team leadership through mentoring program",
        },
      ],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
    })
    .returning();

  // Manager Effectiveness 180 Template
  const [manager180] = await db
    .insert(assessmentTemplates)
    .values({
      agencyId: agency.id,
      name: "Manager Effectiveness 180",
      description: "Manager feedback assessment focusing on core management competencies",
      type: "180",
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
      competencies: [
        {
          id: "mgr-1",
          name: "Performance Management",
          description: "Ability to manage and improve team performance",
          questions: [
            { id: "mq1-1", text: "Sets clear expectations and goals for team members" },
            { id: "mq1-2", text: "Provides regular and actionable feedback" },
            { id: "mq1-3", text: "Addresses performance issues promptly and fairly" },
          ],
        },
        {
          id: "mgr-2",
          name: "Coaching & Development",
          description: "Support for employee growth and development",
          questions: [
            { id: "mq2-1", text: "Invests time in developing team members" },
            { id: "mq2-2", text: "Provides opportunities for growth and learning" },
            { id: "mq2-3", text: "Helps team members identify career goals" },
          ],
        },
        {
          id: "mgr-3",
          name: "Operational Excellence",
          description: "Efficiency in managing day-to-day operations",
          questions: [
            { id: "mq3-1", text: "Manages resources and priorities effectively" },
            { id: "mq3-2", text: "Removes obstacles for the team" },
            { id: "mq3-3", text: "Ensures processes are efficient and effective" },
          ],
        },
      ],
      goalSuggestionRules: [
        {
          competencyId: "mgr-2",
          threshold: 3,
          operator: "less_than",
          suggestedGoal: "Enhance coaching skills through manager development program",
        },
      ],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
    })
    .returning();

  // Executive Competency Assessment
  const [execAssessment] = await db
    .insert(assessmentTemplates)
    .values({
      agencyId: agency.id,
      name: "Executive Competency Assessment",
      description: "Comprehensive assessment for senior executives covering all key leadership dimensions",
      type: "360",
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ["Developing", "Proficient", "Advanced", "Expert", "Mastery"],
      competencies: [
        {
          id: "exec-1",
          name: "Visionary Leadership",
          description: "Ability to create and communicate compelling vision",
          questions: [
            { id: "eq1-1", text: "Articulates a clear and inspiring vision for the future" },
            { id: "eq1-2", text: "Aligns team and organizational efforts with strategic vision" },
            { id: "eq1-3", text: "Champions innovation and change" },
          ],
        },
        {
          id: "exec-2",
          name: "Business Acumen",
          description: "Understanding of business operations and financials",
          questions: [
            { id: "eq2-1", text: "Demonstrates strong understanding of business drivers" },
            { id: "eq2-2", text: "Makes financially sound decisions" },
            { id: "eq2-3", text: "Understands market dynamics and competitive landscape" },
          ],
        },
        {
          id: "exec-3",
          name: "Stakeholder Management",
          description: "Effectiveness in managing relationships with key stakeholders",
          questions: [
            { id: "eq3-1", text: "Builds strong relationships with key stakeholders" },
            { id: "eq3-2", text: "Effectively manages board and investor relationships" },
            { id: "eq3-3", text: "Represents the organization professionally externally" },
          ],
        },
        {
          id: "exec-4",
          name: "Organizational Development",
          description: "Ability to build and develop high-performing organizations",
          questions: [
            { id: "eq4-1", text: "Builds high-performing leadership teams" },
            { id: "eq4-2", text: "Creates a culture of excellence and accountability" },
            { id: "eq4-3", text: "Develops succession plans for critical roles" },
          ],
        },
      ],
      goalSuggestionRules: [],
      allowComments: true,
      requireComments: true,
      anonymizeResponses: true,
    })
    .returning();

  // Team Collaboration Survey
  const [teamSurvey] = await db
    .insert(assessmentTemplates)
    .values({
      agencyId: agency.id,
      name: "Team Collaboration Survey",
      description: "Quick assessment to gauge team collaboration and dynamics",
      type: "180",
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
      competencies: [
        {
          id: "team-1",
          name: "Collaboration",
          description: "Effectiveness of team collaboration",
          questions: [
            { id: "tq1-1", text: "Team members work well together" },
            { id: "tq1-2", text: "Information is shared openly within the team" },
            { id: "tq1-3", text: "Conflicts are resolved constructively" },
          ],
        },
        {
          id: "team-2",
          name: "Trust & Respect",
          description: "Level of trust and mutual respect",
          questions: [
            { id: "tq2-1", text: "Team members trust each other" },
            { id: "tq2-2", text: "Diverse perspectives are valued and respected" },
          ],
        },
      ],
      goalSuggestionRules: [],
      allowComments: true,
      requireComments: false,
      anonymizeResponses: true,
    })
    .returning();

  console.log(`✓ Assessment templates created: ${leadership360.name}, ${manager180.name}, ${execAssessment.name}, ${teamSurvey.name}\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("═".repeat(50));
  console.log("🎉 Seed completed successfully!\n");
  console.log("Created:");
  console.log(`  • 1 Agency: ${agency.name}`);
  console.log(`  • 2 Pricing Plans: ${starterPlan.name}, ${proPlan.name}`);
  console.log(`  • 1 Tenant: ${tenant.name}`);
  console.log(`  • 4 Users`);
  console.log(`  • 1 Program with 2 modules and 5 lessons`);
  console.log(`  • 3 Enrollments`);
  console.log(`  • 1 Scorecard with 3 KPIs`);
  console.log(`  • 2 Goals with milestones`);
  console.log(`  • 1 Coaching relationship`);
  console.log(`  • 1 Announcement`);
  console.log(`  • 4 Assessment Templates`);
  console.log("");
  console.log("Test accounts:");
  console.log(`  • Admin: admin@acme.com`);
  console.log(`  • User 1: john.doe@acme.com`);
  console.log(`  • User 2: jane.smith@acme.com`);
  console.log(`  • Coach: coach@acme.com`);
  console.log("");
  console.log("Note: Firebase UIDs are placeholders. Update them after");
  console.log("creating real Firebase accounts to enable login.");
  console.log("═".repeat(50));

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});

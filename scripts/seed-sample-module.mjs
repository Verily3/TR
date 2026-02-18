import http from 'http';

const TENANT_ID = '698c95be-54de-4d74-af0d-5b142ff913c0';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3002, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Login
  const login = await request('POST', '/api/auth/login', {
    email: 'admin@techcorp.com',
    password: 'password123',
  });
  const token = login.data?.accessToken;
  if (!token) { console.error('Login failed', login); process.exit(1); }
  console.log('Logged in OK');

  // 2. Find LeaderShift program
  const programs = await request('GET', `/api/tenants/${TENANT_ID}/programs`, null, token);
  const program = (programs.data || []).find((p) =>
    p.name?.toLowerCase().includes('leader')
  );
  if (!program) {
    console.log('Programs found:', (programs.data || []).map((p) => p.name));
    console.error('No leadership program found'); process.exit(1);
  }
  console.log('Using program:', program.id, program.name);

  // 3. Create module "Sample Module"
  const modRes = await request(
    'POST',
    `/api/tenants/${TENANT_ID}/programs/${program.id}/modules`,
    { title: 'Sample Module', description: 'Showcases every lesson type available in the curriculum builder.' },
    token
  );
  const module = modRes.data;
  if (!module?.id) { console.error('Module creation failed', modRes); process.exit(1); }
  console.log('Module created:', module.id);

  const BASE = `/api/tenants/${TENANT_ID}/programs/${program.id}/modules/${module.id}/lessons`;

  async function createLesson(payload) {
    const r = await request('POST', BASE, payload, token);
    if (!r.data?.id) { console.error('Lesson failed', payload.title, r); return null; }
    console.log('  Lesson created:', r.data.id, payload.title);
    return r.data;
  }

  // 4. Create one lesson of every type

  // --- Reading (lesson) ---
  await createLesson({
    title: 'Reading',
    contentType: 'lesson',
    content: {
      introduction: 'Leadership begins with self-awareness.',
      mainContent: `<h2>The Foundation of Effective Leadership</h2>
<p>Great leaders are not born — they are built through deliberate practice, continuous learning, and a commitment to personal growth. This module introduces the core principles that underpin every high-performing leader's toolkit.</p>
<h3>Core Principles</h3>
<ul>
  <li><strong>Clarity of purpose</strong> — knowing why you lead and what you stand for</li>
  <li><strong>Emotional intelligence</strong> — understanding and managing your own emotions while empathising with others</li>
  <li><strong>Accountability</strong> — owning your results, not just your intentions</li>
</ul>
<p>As you work through this program, return to these principles. They will act as your compass when decisions become difficult.</p>`,
      resources: [],
    },
    points: 100,
    durationMinutes: 10,
  });

  // --- Video (lesson) ---
  await createLesson({
    title: 'Video',
    contentType: 'lesson',
    content: {
      videoUrl: 'https://www.youtube.com/watch?v=lmyZMtPVodo',
      introduction: 'Watch this short overview of the LeaderShift model.',
      mainContent: '',
      resources: [],
    },
    points: 100,
    durationMinutes: 8,
  });

  // --- Key Concepts (lesson) ---
  await createLesson({
    title: 'Key Concepts',
    contentType: 'lesson',
    content: {
      introduction: 'The five concepts every leader must internalise.',
      mainContent: `<h2>Core Concepts at a Glance</h2>
<p>Before progressing, ensure you can define and apply each of the following concepts in your own leadership context.</p>`,
      keyConcepts: [
        { id: 'kc1', title: 'Intentional Leadership', description: 'Leading with deliberate focus rather than reacting to circumstances. Every interaction is an opportunity to model your values.' },
        { id: 'kc2', title: 'The Accountability Loop', description: 'A cycle of commitment → action → review → learning that drives continuous improvement in teams and individuals.' },
        { id: 'kc3', title: 'Emotional Agility', description: 'The ability to acknowledge difficult emotions without being controlled by them, enabling better decision-making under pressure.' },
        { id: 'kc4', title: 'Multiplier Mindset', description: 'Believing that the intelligence around you can always be developed and amplified, not just consumed.' },
        { id: 'kc5', title: 'Legacy Thinking', description: 'Asking "What am I building?" rather than "What am I doing today?" to keep long-term impact at the centre of daily choices.' },
      ],
      resources: [],
    },
    points: 50,
    durationMinutes: 5,
  });

  // --- Quiz ---
  await createLesson({
    title: 'Quiz',
    contentType: 'quiz',
    content: {
      introduction: 'Test your understanding of this module.',
      questions: [
        {
          id: 'q1',
          text: 'Which of the following best describes Intentional Leadership?',
          type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Reacting quickly to change' },
            { id: 'b', text: 'Leading with deliberate focus aligned to your values', correct: true },
            { id: 'c', text: 'Delegating all decisions to the team' },
            { id: 'd', text: 'Following established processes without deviation' },
          ],
        },
        {
          id: 'q2',
          text: 'Emotional Agility means:',
          type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Suppressing emotions at work' },
            { id: 'b', text: 'Expressing emotions freely at all times' },
            { id: 'c', text: 'Acknowledging emotions without being controlled by them', correct: true },
            { id: 'd', text: 'Avoiding emotionally charged situations' },
          ],
        },
        {
          id: 'q3',
          text: 'The Accountability Loop includes which step?',
          type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Blame → Excuse → Justify' },
            { id: 'b', text: 'Commitment → Action → Review → Learning', correct: true },
            { id: 'c', text: 'Plan → Delegate → Forget' },
            { id: 'd', text: 'Observe → React → Repeat' },
          ],
        },
      ],
      passingScore: 70,
      resources: [],
    },
    points: 200,
    durationMinutes: 10,
  });

  // --- Most Useful Idea (text_form) ---
  await createLesson({
    title: 'Most Useful Idea',
    contentType: 'text_form',
    content: {
      introduction: 'Reflect on what you have learned so far.',
      prompt: 'What is the single most useful idea from this module? Be specific about why this concept is valuable for your leadership development and how you plan to apply it.',
      placeholder: 'Describe the idea and why it resonates with you...',
      minLength: 50,
      resources: [],
    },
    points: 500,
    durationMinutes: 15,
  });

  // --- How You Used This Idea (text_form) ---
  await createLesson({
    title: 'How You Used This Idea',
    contentType: 'text_form',
    content: {
      introduction: 'Apply your learning to a real situation.',
      prompt: 'Describe a specific situation where you applied the most useful idea from this module. What did you do differently? What was the outcome?',
      placeholder: 'Describe the situation, your actions, and the result...',
      minLength: 100,
      resources: [],
    },
    points: 750,
    durationMinutes: 20,
  });

  // --- Text Form ---
  await createLesson({
    title: 'Text Form',
    contentType: 'text_form',
    content: {
      introduction: 'Share your perspective.',
      prompt: 'In your own words, define what great leadership means in your current context.',
      placeholder: 'Enter your response here...',
      minLength: 0,
      resources: [],
    },
    points: 300,
    durationMinutes: 10,
  });

  // --- Assignment ---
  await createLesson({
    title: 'Assignment',
    contentType: 'assignment',
    content: {
      introduction: 'Complete this assignment before your next session.',
      description: 'Conduct a 360-feedback conversation with two people you lead. Ask them: (1) What one thing do I do well as a leader? (2) What one thing could I do differently to be more effective?\n\nDocument the feedback you receive and your initial reflections. Submit a summary (min 300 words) covering what you heard, what surprised you, and what action you will take.',
      questions: [
        {
          id: 'aq1',
          text: 'Summarise the feedback you received from Person 1.',
          type: 'text',
        },
        {
          id: 'aq2',
          text: 'Summarise the feedback you received from Person 2.',
          type: 'text',
        },
        {
          id: 'aq3',
          text: 'What surprised you most, and why?',
          type: 'text',
        },
        {
          id: 'aq4',
          text: 'What single action will you commit to as a result of this feedback?',
          type: 'text',
        },
      ],
      resources: [],
    },
    points: 1000,
    durationMinutes: 45,
  });

  // --- Food for Thought (assignment) ---
  await createLesson({
    title: 'Food for Thought',
    contentType: 'assignment',
    content: {
      introduction: 'These reflection questions are designed to challenge your thinking. There are no right or wrong answers.',
      questions: [
        {
          id: 'fq1',
          text: 'Think of a leader who had a profoundly positive impact on you. What specifically did they do that made the difference?',
          hint: 'Focus on behaviours and choices, not personality traits.',
          type: 'text',
        },
        {
          id: 'fq2',
          text: 'Where in your current role are you leading reactively rather than intentionally? What would change if you led that area with full intention?',
          hint: 'Be honest. The gap between intention and reality is where growth lives.',
          type: 'text',
        },
        {
          id: 'fq3',
          text: 'If your team described your leadership style to a new hire, what would they say? Is that how you would want to be described?',
          hint: 'Consider asking someone you trust to answer this honestly.',
          type: 'text',
        },
      ],
      resources: [],
    },
    points: 600,
    durationMinutes: 25,
  });

  // --- Goal ---
  await createLesson({
    title: 'Goal',
    contentType: 'goal',
    content: {
      introduction: 'Set a meaningful leadership goal based on your learnings from this module.',
      description: 'Use the prompts below to craft a specific, measurable goal that you will pursue over the next 30–90 days. Your mentor will review and support your progress.',
      resources: [],
    },
    points: 1500,
    durationMinutes: 20,
  });

  console.log('\nAll lessons created successfully!');
  console.log(`View at: http://localhost:3003/program-builder/${program.id}?tenantId=${TENANT_ID}`);
}

main().catch(console.error);

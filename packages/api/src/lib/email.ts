import { Resend } from 'resend';
import { env } from './env.js';

const resend = new Resend(env.RESEND_API_KEY);

const FROM = 'Transformation OS <noreply@transformingresults.com>';

/**
 * Core send wrapper. Returns silently if RESEND_API_KEY is not configured (dev without key).
 */
async function send(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — skipping send to ${options.to}: "${options.subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (error) {
      console.error('[email] Resend error:', error);
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}

// ─── Assessment Emails ────────────────────────────────────────────────────────

export async function sendAssessmentInvitation(params: {
  to: string;
  name: string;
  assessorName: string;
  assessmentName: string;
  respondUrl: string;
  expiresAt?: Date;
}): Promise<void> {
  const expiry = params.expiresAt
    ? `This link expires on ${params.expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
    : '';

  await send({
    to: params.to,
    subject: `You've been invited to complete an assessment`,
    html: emailHtml({
      title: "You've been invited to complete an assessment",
      preheader: `${params.assessorName} has invited you to provide feedback`,
      body: `
        <p>Hi ${params.name},</p>
        <p><strong>${params.assessorName}</strong> has invited you to complete the <strong>${params.assessmentName}</strong> assessment.</p>
        <p>Your honest feedback helps support professional growth and development. The assessment should take about 10–15 minutes to complete.</p>
        ${expiry ? `<p style="color:#6b7280;font-size:14px;">${expiry}</p>` : ''}
      `,
      ctaUrl: params.respondUrl,
      ctaLabel: 'Start Assessment',
    }),
  });
}

export async function sendAssessmentReminder(params: {
  to: string;
  name: string;
  assessorName: string;
  assessmentName: string;
  respondUrl: string;
  reminderCount: number;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Reminder: Your assessment response is due`,
    html: emailHtml({
      title: 'Friendly reminder',
      preheader: `You still have an assessment waiting for your response`,
      body: `
        <p>Hi ${params.name},</p>
        <p>This is a friendly reminder that you have a pending <strong>${params.assessmentName}</strong> assessment from <strong>${params.assessorName}</strong>.</p>
        <p>Your response is still needed. It only takes 10–15 minutes and makes a real difference.</p>
      `,
      ctaUrl: params.respondUrl,
      ctaLabel: 'Complete Assessment',
    }),
  });
}

// ─── Auth / User Emails ───────────────────────────────────────────────────────

export async function sendUserWelcome(params: {
  to: string;
  name: string;
  setPasswordUrl: string;
  organizationName?: string;
}): Promise<void> {
  const org = params.organizationName ? ` at <strong>${params.organizationName}</strong>` : '';
  await send({
    to: params.to,
    subject: 'Welcome to Transformation OS — Set your password',
    html: emailHtml({
      title: 'Welcome to Transformation OS',
      preheader: 'Your account has been created — set your password to get started',
      body: `
        <p>Hi ${params.name},</p>
        <p>Your account${org} has been created on Transformation OS. Click the button below to set your password and access your account.</p>
        <p style="color:#6b7280;font-size:14px;">This link expires in 72 hours. If you did not expect this email, you can safely ignore it.</p>
      `,
      ctaUrl: params.setPasswordUrl,
      ctaLabel: 'Set Your Password',
    }),
  });
}

export async function sendPasswordReset(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: 'Reset your password',
    html: emailHtml({
      title: 'Password reset request',
      preheader: 'Click the link to reset your Transformation OS password',
      body: `
        <p>Hi ${params.name},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one.</p>
        <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
      `,
      ctaUrl: params.resetUrl,
      ctaLabel: 'Reset Password',
    }),
  });
}

// ─── Program Emails ───────────────────────────────────────────────────────────

export async function sendProgramWelcome(params: {
  to: string;
  name: string;
  programName: string;
  startDate?: string;
  programUrl: string;
}): Promise<void> {
  const dateNote = params.startDate
    ? `<p>The program begins on <strong>${params.startDate}</strong>. We'll send you a reminder when it's time to start.</p>`
    : '';
  await send({
    to: params.to,
    subject: `You've been enrolled in ${params.programName}`,
    html: emailHtml({
      title: `Welcome to ${params.programName}`,
      preheader: `You've been enrolled — here's everything you need to know`,
      body: `
        <p>Hi ${params.name},</p>
        <p>You've been enrolled in <strong>${params.programName}</strong>. We're excited to have you on this journey.</p>
        ${dateNote}
        <p>Click below to view your program and get started.</p>
      `,
      ctaUrl: params.programUrl,
      ctaLabel: 'View Program',
    }),
  });
}

export async function sendProgramKickoff(params: {
  to: string;
  name: string;
  programName: string;
  programUrl: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `${params.programName} starts today`,
    html: emailHtml({
      title: `Today's the day!`,
      preheader: `${params.programName} is officially underway`,
      body: `
        <p>Hi ${params.name},</p>
        <p><strong>${params.programName}</strong> is officially underway. Your first module is ready and waiting.</p>
        <p>Log in to get started — your facilitator and fellow participants are ready to go.</p>
      `,
      ctaUrl: params.programUrl,
      ctaLabel: 'Start Now',
    }),
  });
}

export async function sendWeeklyDigest(params: {
  to: string;
  name: string;
  programName: string;
  progress: number;
  modulesCompleted: number;
  pointsEarned: number;
  nextUrl: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Your weekly progress in ${params.programName}`,
    html: emailHtml({
      title: 'Weekly Progress Summary',
      preheader: `You're ${params.progress}% through ${params.programName}`,
      body: `
        <p>Hi ${params.name},</p>
        <p>Here's your progress update for <strong>${params.programName}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#1f2937;">${params.progress}%</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Overall Progress</div>
            </td>
            <td style="width:16px;"></td>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#1f2937;">${params.modulesCompleted}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Modules Completed</div>
            </td>
            <td style="width:16px;"></td>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#1f2937;">${params.pointsEarned}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Points Earned</div>
            </td>
          </tr>
        </table>
        <p>Keep up the great work. Your next module is ready when you are.</p>
      `,
      ctaUrl: params.nextUrl,
      ctaLabel: 'Continue Learning',
    }),
  });
}

export async function sendInactivityReminder(params: {
  to: string;
  name: string;
  programName: string;
  daysSinceActive: number;
  resumeUrl: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `We miss you — pick up where you left off`,
    html: emailHtml({
      title: "It's been a while",
      preheader: `You haven't visited ${params.programName} in ${params.daysSinceActive} days`,
      body: `
        <p>Hi ${params.name},</p>
        <p>You haven't logged into <strong>${params.programName}</strong> in ${params.daysSinceActive} days. Your progress is saved and your next module is ready whenever you are.</p>
        <p>Even 15 minutes a day makes a big difference. Jump back in below.</p>
      `,
      ctaUrl: params.resumeUrl,
      ctaLabel: 'Resume Program',
    }),
  });
}

export async function sendMilestoneCelebration(params: {
  to: string;
  name: string;
  programName: string;
  milestone: 25 | 50 | 75 | 100;
  programUrl: string;
}): Promise<void> {
  const messages: Record<number, string> = {
    25: "You're off to a great start! You've completed 25% of the program.",
    50: "Halfway there! You've completed 50% of the program — keep going!",
    75: "Almost there! You've completed 75% of the program. The finish line is in sight.",
    100: "You did it! You've successfully completed the entire program. Congratulations!",
  };

  await send({
    to: params.to,
    subject: `You've reached ${params.milestone}% in ${params.programName}!`,
    html: emailHtml({
      title: `🎉 ${params.milestone}% Complete!`,
      preheader: messages[params.milestone],
      body: `
        <p>Hi ${params.name},</p>
        <p>${messages[params.milestone]}</p>
        <p>Program: <strong>${params.programName}</strong></p>
      `,
      ctaUrl: params.programUrl,
      ctaLabel: params.milestone === 100 ? 'View Certificate' : 'Continue Learning',
    }),
  });
}

export async function sendProgramCompletion(params: {
  to: string;
  name: string;
  programName: string;
  programUrl: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Congratulations! You've completed ${params.programName}`,
    html: emailHtml({
      title: 'Program Complete!',
      preheader: `You've successfully completed ${params.programName}`,
      body: `
        <p>Hi ${params.name},</p>
        <p>Congratulations on completing <strong>${params.programName}</strong>! This is a significant achievement that reflects your commitment to growth and development.</p>
        <p>Your certificate and results are available in your account.</p>
      `,
      ctaUrl: params.programUrl,
      ctaLabel: 'View Results',
    }),
  });
}

// ─── Shared HTML Layout ───────────────────────────────────────────────────────

function emailHtml(params: {
  title: string;
  preheader: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${params.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${params.preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1f2937;border-radius:12px 12px 0 0;padding:24px 32px;">
              <p style="margin:0;color:#f9fafb;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Transformation OS</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;color:#374151;font-size:15px;line-height:1.7;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">${params.title}</h1>
              ${params.body}
              <!-- CTA Button -->
              <div style="margin:28px 0;">
                <a href="${params.ctaUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">${params.ctaLabel}</a>
              </div>
              <p style="color:#9ca3af;font-size:13px;">If the button doesn't work, copy and paste this link:<br>
                <a href="${params.ctaUrl}" style="color:#6b7280;word-break:break-all;">${params.ctaUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this email because you have an account on Transformation OS.<br>
                © ${new Date().getFullYear()} Transformation OS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

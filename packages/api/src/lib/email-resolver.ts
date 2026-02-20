/**
 * Email Resolver — Three-tier email configuration resolution
 *
 * Resolution chain (highest priority last wins):
 *   Hardcoded defaults → Agency config → Program config → (user opt-out blocks)
 *
 * Transactional types (passwordReset, userWelcome, assessmentInvitation,
 * subjectInvitation) are always sent regardless of user opt-out preferences.
 */
import { db } from '@tr/db';
import { agencies, notificationPreferences } from '@tr/db/schema';
import { eq } from 'drizzle-orm';
import type { AgencyEmailConfig, AgencyEmailTypeConfig } from '@tr/db/schema';
import type { ProgramEmailSettings } from '@tr/db/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedEmailContent {
  subject: string;
  body: string;
  /** false = this email should NOT be sent (disabled or user opted out) */
  enabled: boolean;
}

export interface EmailDefaults {
  subject: string;
  body: string;
}

// Email types that bypass user opt-out (transactional / security)
const TRANSACTIONAL_TYPES = new Set([
  'passwordReset',
  'userWelcome',
  'assessmentInvitation',
  'subjectInvitation',
]);

// ─── Agency config cache (5-minute TTL) ───────────────────────────────────────

interface CacheEntry {
  config: AgencyEmailConfig;
  expiresAt: number;
}

const agencyConfigCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getAgencyEmailConfig(agencyId: string): Promise<AgencyEmailConfig> {
  const cached = agencyConfigCache.get(agencyId);
  if (cached && cached.expiresAt > Date.now()) return cached.config;

  const [agency] = await db
    .select({ emailConfig: agencies.emailConfig })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);

  const config: AgencyEmailConfig = (agency?.emailConfig as AgencyEmailConfig) ?? {};
  agencyConfigCache.set(agencyId, { config, expiresAt: Date.now() + CACHE_TTL_MS });
  return config;
}

/** Call this after saving agency email config to invalidate the cache entry. */
export function invalidateAgencyEmailConfigCache(agencyId: string): void {
  agencyConfigCache.delete(agencyId);
}

// ─── User preference check ────────────────────────────────────────────────────

/**
 * Maps email type → notification_preferences.preferences key.
 * If a type has no mapping it's considered always-allowed (no user toggle for it).
 */
const EMAIL_TYPE_TO_PREF_KEY: Record<string, string> = {
  welcome: 'program_updates',
  kickoff: 'program_updates',
  weeklyDigest: 'weekly_digest',
  inactivity: 'program_updates',
  milestones: 'program_updates',
  completion: 'program_updates',
  mentorSummary: 'mentor_updates',
  assessmentReminder: 'assessment_updates',
};

async function isEmailAllowedByUserPrefs(
  userId: string,
  emailType: string
): Promise<boolean> {
  // Transactional types are never blocked
  if (TRANSACTIONAL_TYPES.has(emailType)) return true;

  const prefKey = EMAIL_TYPE_TO_PREF_KEY[emailType];
  if (!prefKey) return true; // no user toggle for this type

  const [prefs] = await db
    .select({ emailEnabled: notificationPreferences.emailEnabled, preferences: notificationPreferences.preferences })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!prefs) return true; // no preferences row = use defaults (all on)
  if (!prefs.emailEnabled) return false; // master email kill switch

  const perType = prefs.preferences as Record<string, boolean>;
  if (prefKey in perType) return perType[prefKey];

  return true; // key not set = default on
}

// ─── Program-level enabled check ─────────────────────────────────────────────

function isProgramEnabled(
  emailType: string,
  programConfig: ProgramEmailSettings | null | undefined,
  agencyTypeConfig: AgencyEmailTypeConfig
): boolean {
  // Agency marked this as mandatory — program setting is ignored
  if (agencyTypeConfig.mandatory) return true;

  const programFlagMap: Partial<Record<string, keyof ProgramEmailSettings>> = {
    welcome: 'welcome',
    kickoff: 'kickoff',
    weeklyDigest: 'weeklyDigest',
    inactivity: 'inactivityReminders',
    milestones: 'milestones',
    completion: 'completion',
    mentorSummary: 'mentorSummary',
  };

  const programKey = programFlagMap[emailType];
  if (programKey && programConfig) {
    const val = programConfig[programKey];
    if (typeof val === 'boolean') return val;
  }

  // Fall back to agency default (default: enabled)
  return agencyTypeConfig.enabled ?? true;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveEmailContent(params: {
  emailType: string;
  agencyId: string | null;
  programConfig?: ProgramEmailSettings | null;
  userId?: string;
  defaults: EmailDefaults;
}): Promise<ResolvedEmailContent> {
  const { emailType, agencyId, programConfig, userId, defaults } = params;

  // Load agency config (empty if no agencyId)
  const agencyConfig = agencyId ? await getAgencyEmailConfig(agencyId) : {};
  const agencyTypeConfig: AgencyEmailTypeConfig = agencyConfig[emailType] ?? {};

  // Check if enabled at program level (respecting mandatory lock)
  const programEnabled = isProgramEnabled(emailType, programConfig, agencyTypeConfig);
  if (!programEnabled) {
    return { subject: defaults.subject, body: defaults.body, enabled: false };
  }

  // Check user opt-out (skip for transactional types)
  if (userId) {
    const userAllowed = await isEmailAllowedByUserPrefs(userId, emailType);
    if (!userAllowed) {
      return { subject: defaults.subject, body: defaults.body, enabled: false };
    }
  }

  // Merge content: program override > agency override > hardcoded default
  const subject =
    programConfig?.subjectOverrides?.[emailType] ??
    agencyTypeConfig.subject ??
    defaults.subject;

  const body =
    programConfig?.bodyOverrides?.[emailType] ??
    agencyTypeConfig.body ??
    defaults.body;

  return { subject, body, enabled: true };
}

// Agency Portal Types

export type ClientStatus = "active" | "trial" | "suspended" | "churned";

export type SubscriptionTier = "starter" | "professional" | "enterprise";

export interface Client {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  industry: string;
  status: ClientStatus;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  users: number;
  usersLimit: number;
  activePrograms: number;
  contactName: string;
  contactEmail: string;
  mrr: number; // Monthly Recurring Revenue
  lastActivity: string;
}

export interface AgencyTemplate {
  id: string;
  name: string;
  description: string;
  type: "program" | "assessment" | "goal";
  category: string;
  isPublished: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BrandingConfig {
  primaryColor: string;
  accentColor: string;
  logo?: string;
  favicon?: string;
  companyName: string;
  supportEmail: string;
  customDomain?: string;
  customCSS?: string;
}

export interface AgencyStats {
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalMRR: number;
  mrrGrowth: number;
  avgUsersPerClient: number;
  trialConversionRate: number;
  churnRate: number;
}

export interface AgencyBilling {
  totalMRR: number;
  totalARR: number;
  outstandingInvoices: number;
  revenueByTier: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  recentTransactions: Transaction[];
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: "subscription" | "addon" | "refund";
  status: "completed" | "pending" | "failed";
  date: string;
}

// Props interfaces
export interface AgencyPageProps {
  stats?: AgencyStats;
  clients?: Client[];
  templates?: AgencyTemplate[];
  branding?: BrandingConfig;
  billing?: AgencyBilling;
}

export interface ClientsTabProps {
  clients?: Client[];
  onViewClient?: (clientId: string) => void;
  onCreateClient?: () => void;
}

export interface TemplatesTabProps {
  templates?: AgencyTemplate[];
  onViewTemplate?: (templateId: string) => void;
  onCreateTemplate?: () => void;
}

export interface BrandingTabProps {
  branding?: BrandingConfig;
  onSave?: (branding: Partial<BrandingConfig>) => void;
}

export interface AgencyBillingTabProps {
  billing?: AgencyBilling;
  clients?: Client[];
}

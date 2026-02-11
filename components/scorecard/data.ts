import type {
  Accountability,
  KPICategory,
  Competency,
  DirectReport,
  HealthCategory,
} from "./types";

export const defaultAccountabilities: Accountability[] = [
  {
    id: "acc-1",
    title: "Strategic Direction & Vision",
    description:
      "Establish and execute a 3–5 year growth strategy aligned with market trends and company capabilities",
    score: 92,
    status: "on-track",
  },
  {
    id: "acc-2",
    title: "Revenue & Profit Growth",
    description:
      "Achieve YoY revenue growth of X%, with margin expansion. Balance growth between raw and cooked segments",
    score: 88,
    status: "on-track",
  },
  {
    id: "acc-3",
    title: "Operational Excellence",
    description:
      "Partner with President/COO to drive efficiencies and throughput. Benchmark OEE >85%",
    score: 78,
    status: "at-risk",
  },
  {
    id: "acc-4",
    title: "Brand Expansion",
    description:
      "Grow brand awareness and trust in both B2B and retail channels; launch national campaigns",
    score: 85,
    status: "on-track",
  },
  {
    id: "acc-5",
    title: "Talent & Culture",
    description:
      "Attract and retain A-player executives; achieve >90% leadership retention; drive high-performance culture",
    score: 90,
    status: "on-track",
  },
  {
    id: "acc-6",
    title: "Board & Investor Relations",
    description:
      "Maintain transparent communication and trust. Deliver consistent performance against board-approved metrics",
    score: 94,
    status: "on-track",
  },
  {
    id: "acc-7",
    title: "M&A/Strategic Partnerships",
    description:
      "Lead successful acquisitions or joint ventures to strengthen capabilities, market share, or capacity",
    score: 72,
    status: "needs-attention",
  },
  {
    id: "acc-8",
    title: "Compliance & Risk Oversight",
    description:
      "Ensure regulatory and food safety compliance; zero critical violations; proactively mitigate risk",
    score: 96,
    status: "on-track",
  },
];

export const defaultKPICategories: KPICategory[] = [
  {
    id: "financial",
    name: "Financial",
    iconName: "DollarSign",
    kpis: [
      { id: "f1", label: "EBITDA", value: "$24.5M", target: "$23M", change: "+6.5%", trend: "up" },
      { id: "f2", label: "Net Margin %", value: "8.2%", target: "8.0%", change: "+0.3%", trend: "up" },
      { id: "f3", label: "Revenue Growth %", value: "12.4%", target: "10%", change: "+2.4%", trend: "up" },
      { id: "f4", label: "ROIC", value: "14.8%", target: "15%", change: "-0.5%", trend: "down" },
    ],
  },
  {
    id: "operational",
    name: "Operational",
    iconName: "Factory",
    kpis: [
      { id: "o1", label: "Plant OEE", value: "82.3%", target: "85%", change: "-2.7%", trend: "down" },
      { id: "o2", label: "Yield %", value: "94.1%", target: "95%", change: "0%", trend: "neutral" },
      { id: "o3", label: "Downtime Hours", value: "124", target: "<100", change: "+24%", trend: "down" },
      { id: "o4", label: "Throughput/Shift", value: "12.8K lbs", target: "13K lbs", change: "+3%", trend: "up" },
    ],
  },
  {
    id: "market-growth",
    name: "Market Growth",
    iconName: "TrendingUp",
    kpis: [
      { id: "m1", label: "Market Share (Cooked)", value: "18.2%", target: "20%", change: "+1.5%", trend: "up" },
      { id: "m2", label: "New Product Revenue %", value: "15%", target: "12%", change: "+3%", trend: "up" },
      { id: "m3", label: "Customer Retention", value: "94%", target: "95%", change: "-1%", trend: "down" },
    ],
  },
  {
    id: "people-culture",
    name: "People & Culture",
    iconName: "Users",
    kpis: [
      { id: "p1", label: "% A-Players in Leadership", value: "78%", target: "80%", change: "+5%", trend: "up" },
      { id: "p2", label: "Engagement Score", value: "87%", target: "85%", change: "+2%", trend: "up" },
      { id: "p3", label: "Executive Team Stability", value: "92%", target: "90%", change: "+2%", trend: "up" },
    ],
  },
  {
    id: "compliance-safety",
    name: "Compliance & Safety",
    iconName: "Shield",
    kpis: [
      { id: "c1", label: "USDA/FDA Audit Score", value: "98", target: ">95", change: "+3%", trend: "up" },
      { id: "c2", label: "Critical Violations", value: "0", target: "0", change: "0", trend: "neutral" },
      { id: "c3", label: "TRIR", value: "2.1", target: "<2.5", change: "-15%", trend: "up", invertTrend: true },
    ],
  },
  {
    id: "brand-strength",
    name: "Brand Strength",
    iconName: "Award",
    kpis: [
      { id: "b1", label: "National Distribution Points", value: "8,420", target: "9,000", change: "+12%", trend: "up" },
      { id: "b2", label: "Brand Recall Rate", value: "42%", target: "45%", change: "+3%", trend: "up" },
      { id: "b3", label: "NPS (B2B & Retail)", value: "67", target: "70", change: "+5", trend: "up" },
    ],
  },
];

export const defaultCompetencies: Competency[] = [
  {
    id: "comp-1",
    name: "Visionary Leadership",
    description: "Sees around corners and guides the company toward strategic advantage",
    selfRating: 4,
    mentorRating: 4,
  },
  {
    id: "comp-2",
    name: "Financial Acumen",
    description: "Deep P&L mastery; understands drivers of value creation",
    selfRating: 5,
    mentorRating: 5,
  },
  {
    id: "comp-3",
    name: "Influence & Communication",
    description: "Inspires trust with board, customers, regulators, and employees",
    selfRating: 4,
    mentorRating: 5,
  },
  {
    id: "comp-4",
    name: "Talent Magnet",
    description: "Attracts and retains top executives and key talent",
    selfRating: 4,
    mentorRating: 4,
  },
  {
    id: "comp-5",
    name: "Operational Savvy",
    description: "Understands complexities of vertically integrated food processing",
    selfRating: 3,
    mentorRating: 3,
  },
  {
    id: "comp-6",
    name: "Customer Intuition",
    description: "Understands evolving customer demands across channels",
    selfRating: 4,
    mentorRating: 4,
  },
  {
    id: "comp-7",
    name: "Execution Focus",
    description: "Drives accountability and consistent delivery against critical goals",
    selfRating: 5,
    mentorRating: 4,
  },
  {
    id: "comp-8",
    name: "Crisis Leadership",
    description: "Maintains clarity and calm in times of volatility",
    selfRating: 4,
    mentorRating: 5,
  },
  {
    id: "comp-9",
    name: "High Integrity",
    description: "Embodies ethical, safety-first, and compliant business conduct",
    selfRating: 5,
    mentorRating: 5,
  },
];

export const defaultDirectReports: DirectReport[] = [
  {
    id: "dr-1",
    name: "Sarah Mitchell",
    role: "President/COO",
    scorecardScore: 89,
    scorecardTrend: "up",
    goalsCompleted: 5,
    goalsTotal: 6,
    programsActive: 2,
    rating: "A",
  },
  {
    id: "dr-2",
    name: "Marcus Chen",
    role: "CFO",
    scorecardScore: 92,
    scorecardTrend: "up",
    goalsCompleted: 4,
    goalsTotal: 4,
    programsActive: 1,
    rating: "A",
  },
  {
    id: "dr-3",
    name: "Jennifer Lopez",
    role: "CMO",
    scorecardScore: 85,
    scorecardTrend: "up",
    goalsCompleted: 3,
    goalsTotal: 5,
    programsActive: 3,
    rating: "A-",
  },
  {
    id: "dr-4",
    name: "David Park",
    role: "VP Operations",
    scorecardScore: 78,
    scorecardTrend: "up",
    goalsCompleted: 2,
    goalsTotal: 4,
    programsActive: 2,
    rating: "B+",
  },
  {
    id: "dr-5",
    name: "Amanda Brooks",
    role: "VP Sales",
    scorecardScore: 88,
    scorecardTrend: "up",
    goalsCompleted: 6,
    goalsTotal: 7,
    programsActive: 1,
    rating: "A",
  },
];

export const defaultHealthCategories: HealthCategory[] = [
  { id: "health-1", name: "Strategy", score: 88, change: 3, trend: "up" },
  { id: "health-2", name: "Execution", score: 82, change: 0, trend: "neutral" },
  { id: "health-3", name: "Culture", score: 90, change: 3, trend: "up" },
  { id: "health-4", name: "Learning", score: 85, change: 3, trend: "up" },
  { id: "health-5", name: "Innovation", score: 78, change: -2, trend: "down" },
];

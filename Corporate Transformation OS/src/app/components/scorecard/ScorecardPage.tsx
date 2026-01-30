import { TrendingUp, TrendingDown, Minus, ChevronRight, Target, Users, DollarSign, Factory, Award, Shield, TrendingUp as GrowthIcon } from "lucide-react";

export function ScorecardPage() {
  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sidebar-foreground mb-2">Executive Scorecard</h1>
              <p className="text-muted-foreground">
                Strategic performance dashboard for organizational leadership
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
                <option>Q1 2026</option>
                <option>Q4 2025</option>
                <option>Q3 2025</option>
                <option>Q2 2025</option>
              </select>
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Role & Mission */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xs text-muted-foreground">ROLE</div>
              </div>
              <h2 className="text-sidebar-foreground mb-4">Chief Executive Officer</h2>
              <div className="text-xs text-muted-foreground mb-2">MISSION</div>
              <p className="text-sm text-sidebar-foreground leading-relaxed max-w-4xl">
                Lead the company to profitable, scalable growth by setting strategic direction, strengthening operational
                performance, building a high-performance leadership team, and positioning the brand as a trusted industry
                leader in both raw and value-added chicken products.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">OVERALL SCORE</div>
              <div className="text-3xl text-sidebar-foreground mb-1">87</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+5 vs Q4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Accountabilities */}
        <div className="mb-8">
          <h3 className="text-sidebar-foreground mb-4">Key Accountabilities</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Strategic Direction & Vision",
                description: "Establish and execute a 3–5 year growth strategy aligned with market trends and company capabilities",
                status: "on-track",
                score: 92,
              },
              {
                title: "Revenue & Profit Growth",
                description: "Achieve YoY revenue growth of X%, with margin expansion. Balance growth between raw and cooked segments",
                status: "on-track",
                score: 88,
              },
              {
                title: "Operational Excellence",
                description: "Partner with President/COO to drive efficiencies and throughput. Benchmark OEE >85%",
                status: "at-risk",
                score: 78,
              },
              {
                title: "Brand Expansion",
                description: "Grow brand awareness and trust in both B2B and retail channels; launch national campaigns",
                status: "on-track",
                score: 85,
              },
              {
                title: "Talent & Culture",
                description: "Attract and retain A-player executives; achieve >90% leadership retention; drive high-performance culture",
                status: "on-track",
                score: 90,
              },
              {
                title: "Board & Investor Relations",
                description: "Maintain transparent communication and trust. Deliver consistent performance against board-approved metrics",
                status: "on-track",
                score: 94,
              },
              {
                title: "M&A/Strategic Partnerships",
                description: "Lead successful acquisitions or joint ventures to strengthen capabilities, market share, or capacity",
                status: "needs-attention",
                score: 72,
              },
              {
                title: "Compliance & Risk Oversight",
                description: "Ensure regulatory and food safety compliance; zero critical violations; proactively mitigate risk",
                status: "on-track",
                score: 96,
              },
            ].map((accountability, index) => (
              <div
                key={index}
                className={`bg-card border rounded-lg p-5 ${
                  accountability.status === "on-track"
                    ? "border-green-200"
                    : accountability.status === "at-risk"
                    ? "border-yellow-200"
                    : "border-accent"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm text-sidebar-foreground mb-2">{accountability.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{accountability.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xl text-sidebar-foreground mb-1">{accountability.score}</div>
                    <div
                      className={`text-xs ${
                        accountability.status === "on-track"
                          ? "text-green-600"
                          : accountability.status === "at-risk"
                          ? "text-yellow-600"
                          : "text-accent"
                      }`}
                    >
                      {accountability.status === "on-track"
                        ? "On Track"
                        : accountability.status === "at-risk"
                        ? "At Risk"
                        : "Needs Attention"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="mb-8">
          <h3 className="text-sidebar-foreground mb-4">Key Performance Indicators</h3>

          {/* Financial KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">Financial</h4>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "EBITDA", value: "$24.5M", target: "$23M", trend: "up", change: "+6.5%" },
                { label: "Net Margin %", value: "8.2%", target: "8.0%", trend: "up", change: "+0.3%" },
                { label: "Revenue Growth %", value: "12.4%", target: "10%", trend: "up", change: "+2.4%" },
                { label: "ROIC", value: "14.8%", target: "15%", trend: "down", change: "-0.5%" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        kpi.trend === "up" ? "text-green-600" : "text-accent"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Factory className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">Operational</h4>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Plant OEE", value: "82.3%", target: "85%", trend: "down", change: "-2.7%" },
                { label: "Yield %", value: "94.1%", target: "95%", trend: "neutral", change: "0%" },
                { label: "Downtime Hours", value: "124", target: "<100", trend: "down", change: "+24%" },
                { label: "Throughput/Shift", value: "12.8K lbs", target: "13K lbs", trend: "up", change: "+3%" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        kpi.trend === "up"
                          ? "text-green-600"
                          : kpi.trend === "down"
                          ? "text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : kpi.trend === "down" ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Growth KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <GrowthIcon className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">Market Growth</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Market Share (Cooked)", value: "18.2%", target: "20%", trend: "up", change: "+1.5%" },
                { label: "New Product Revenue %", value: "15%", target: "12%", trend: "up", change: "+3%" },
                { label: "Customer Retention", value: "94%", target: "95%", trend: "down", change: "-1%" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        kpi.trend === "up" ? "text-green-600" : "text-accent"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* People & Culture KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">People & Culture</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "% A-Players in Leadership", value: "78%", target: "80%", trend: "up", change: "+5%" },
                { label: "Engagement Score", value: "87%", target: "85%", trend: "up", change: "+2%" },
                { label: "Executive Team Stability", value: "92%", target: "90%", trend: "up", change: "+2%" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        kpi.trend === "up" ? "text-green-600" : "text-accent"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Safety KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">Compliance & Safety</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "USDA/FDA Audit Score", value: "98", target: ">95", trend: "up", change: "+3%" },
                { label: "Critical Violations", value: "0", target: "0", trend: "neutral", change: "0" },
                { label: "TRIR", value: "2.1", target: "<2.5", trend: "up", change: "-15%" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        kpi.trend === "up"
                          ? "text-green-600"
                          : kpi.trend === "neutral"
                          ? "text-green-600"
                          : "text-accent"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : kpi.trend === "neutral" ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Strength KPIs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-accent" />
              <h4 className="text-sm text-sidebar-foreground">Brand Strength</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "National Distribution Points", value: "8,420", target: "9,000", trend: "up", change: "+12%" },
                { label: "Brand Recall Rate", value: "42%", target: "45%", trend: "up", change: "+3%" },
                { label: "NPS (B2B & Retail)", value: "67", target: "70", trend: "up", change: "+5" },
              ].map((kpi, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                  <div className="text-2xl text-sidebar-foreground mb-1">{kpi.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target}</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* A-Player Competencies */}
        <div className="mb-8">
          <h3 className="text-sidebar-foreground mb-4">A-Player Competencies</h3>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-4">
              {[
                { competency: "Visionary Leadership", selfScore: 4, mentorScore: 4, description: "Sees around corners and guides the company toward strategic advantage" },
                { competency: "Financial Acumen", selfScore: 5, mentorScore: 5, description: "Deep P&L mastery; understands drivers of value creation" },
                { competency: "Influence & Communication", selfScore: 4, mentorScore: 5, description: "Inspires trust with board, customers, regulators, and employees" },
                { competency: "Talent Magnet", selfScore: 4, mentorScore: 4, description: "Attracts and retains top executives and key talent" },
                { competency: "Operational Savvy", selfScore: 3, mentorScore: 3, description: "Understands complexities of vertically integrated food processing" },
                { competency: "Customer Intuition", selfScore: 4, mentorScore: 4, description: "Understands evolving customer demands across channels" },
                { competency: "Execution Focus", selfScore: 5, mentorScore: 4, description: "Drives accountability and consistent delivery against critical goals" },
                { competency: "Crisis Leadership", selfScore: 4, mentorScore: 5, description: "Maintains clarity and calm in times of volatility" },
                { competency: "High Integrity", selfScore: 5, mentorScore: 5, description: "Embodies ethical, safety-first, and compliant business conduct" },
              ].map((item, index) => (
                <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-sidebar-foreground mb-1">{item.competency}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    <div className="ml-6 flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Self</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-6 h-6 rounded ${
                                star <= item.selfScore ? "bg-accent" : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Mentor</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-6 h-6 rounded ${
                                star <= item.mentorScore ? "bg-accent" : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Reports Summary */}
        <div className="mb-8">
          <h3 className="text-sidebar-foreground mb-4">Direct Reports Performance</h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">NAME</th>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">ROLE</th>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">SCORECARD</th>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">GOALS</th>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">PROGRAMS</th>
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-normal">A-PLAYER RATING</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Sarah Mitchell", role: "President/COO", score: 89, goals: "5/6 On Track", programs: "2 Active", rating: "A" },
                  { name: "Marcus Chen", role: "CFO", score: 92, goals: "4/4 On Track", programs: "1 Active", rating: "A" },
                  { name: "Jennifer Lopez", role: "CMO", score: 85, goals: "3/5 On Track", programs: "3 Active", rating: "A-" },
                  { name: "David Park", role: "VP Operations", score: 78, goals: "2/4 On Track", programs: "2 Active", rating: "B+" },
                  { name: "Amanda Brooks", role: "VP Sales", score: 88, goals: "6/7 On Track", programs: "1 Active", rating: "A" },
                ].map((report, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-sidebar-foreground">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-sidebar-foreground">{report.score}</span>
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.goals}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.programs}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          report.rating.startsWith("A")
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {report.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-accent hover:text-accent/80 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Org Health Score */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sidebar-foreground mb-4">Organizational Health Score</h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { category: "Strategy", score: 88, trend: "up" },
              { category: "Execution", score: 82, trend: "neutral" },
              { category: "Culture", score: 90, trend: "up" },
              { category: "Learning", score: 85, trend: "up" },
              { category: "Innovation", score: 78, trend: "down" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-muted-foreground mb-2">{item.category}</div>
                <div className="text-3xl text-sidebar-foreground mb-2">{item.score}</div>
                <div
                  className={`flex items-center justify-center gap-1 text-xs ${
                    item.trend === "up"
                      ? "text-green-600"
                      : item.trend === "neutral"
                      ? "text-muted-foreground"
                      : "text-accent"
                  }`}
                >
                  {item.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : item.trend === "neutral" ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{item.trend === "up" ? "+3" : item.trend === "neutral" ? "0" : "-2"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

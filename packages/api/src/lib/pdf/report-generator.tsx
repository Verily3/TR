import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import { eq } from 'drizzle-orm';
import { db, schema } from '@tr/db';
import type { ComputedAssessmentResults, TemplateConfig } from '@tr/db/schema';
import { styles, colors, raterTypeLabels } from './shared-styles.js';
import { RadarChart, HorizontalBarChart, GapDivergenceChart, CCIGauge, DistributionHistogram } from './svg-charts.js';

const { assessments, assessmentTemplates, users } = schema;

interface ReportData {
  assessmentName: string;
  subjectName: string;
  subjectTitle: string;
  templateName: string;
  assessmentType: '180' | '360' | 'custom';
  completedAt: string;
  config: TemplateConfig;
  results: ComputedAssessmentResults;
}

// ========================================================================
// Page Footer (shared)
// ========================================================================
function PageFooter() {
  return (
    <>
      <View style={styles.footer} fixed>
        <Text>LeaderShift™ — Confidential</Text>
        <Text>Created by The Oxley Group</Text>
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </>
  );
}

// ========================================================================
// Section 1: Cover Page
// ========================================================================
function CoverPage({ data }: { data: ReportData }) {
  return (
    <Page size="A4" style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ alignItems: 'center', marginBottom: 80 }}>
        <Text style={styles.coverTitle}>
          LeaderShift™
        </Text>
        <Text style={styles.coverSubtitle}>
          Leadership Capacity Stress Test
        </Text>
        <View style={{ marginTop: 24 }}>
          <Text style={styles.coverByline}>
            Created by The Oxley Group
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 80 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.black, marginBottom: 6 }}>
          {data.subjectName}
        </Text>
        {data.subjectTitle ? (
          <Text style={{ fontSize: 12, color: colors.mediumGray }}>
            {data.subjectTitle}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontSize: 9, color: colors.mediumGray }}>
          {new Date(data.results.computedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={{ alignItems: 'center', maxWidth: 360 }}>
        <Text style={{ fontSize: 8, color: colors.lightGray, textAlign: 'center', lineHeight: 1.6 }}>
          CONFIDENTIAL — This report contains sensitive feedback and is intended solely for {data.subjectName} and authorized reviewers.
        </Text>
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 2: How to Read This Report
// ========================================================================
function HowToReadPage({ data }: { data: ReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>How to Read This Report</Text>

      <Text style={[styles.bodyText, { marginBottom: 20 }]}>
        Receiving multi-rater feedback can evoke strong emotions. This is normal. Approach this report with curiosity rather than judgment. The data represents perceptions — not absolute truth — and offers valuable perspectives on how others experience your leadership under pressure.
      </Text>

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>Rating Scale</Text>
      <Text style={[styles.mutedText, { marginBottom: 10 }]}>
        Every statement is rated on a frequency-based scale:
      </Text>
      {data.config.scaleLabels.map((label, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.primary, width: 20 }}>
            {data.config.scaleMin + i}
          </Text>
          <Text style={{ fontSize: 10, color: colors.black }}>= {label}</Text>
        </View>
      ))}

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>Rater Groups</Text>
      {(['self', 'manager', 'peer', 'direct_report'] as const).map((type) => {
        const entry = data.results.responseRateByType[type];
        if (!entry) return null;
        return (
          <View key={type} style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.black, width: 100 }}>
              {raterTypeLabels[type]}
            </Text>
            <Text style={{ fontSize: 9, color: colors.mediumGray }}>
              {entry.completed} of {entry.invited} responded ({entry.rate}%)
            </Text>
          </View>
        );
      })}

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>Key Concepts</Text>
      <Text style={[styles.bodyText, { marginBottom: 4 }]}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>Gap Score: </Text>
        Self rating minus Others average. Positive = you rated yourself higher.
      </Text>
      <Text style={[styles.bodyText, { marginBottom: 4 }]}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>Rater Agreement: </Text>
        Standard deviation across raters. Lower = more consensus.
      </Text>

      {data.config.anonymizeResponses && (
        <>
          <View style={styles.thinRule} />
          <Text style={[styles.mutedText]}>
            Rater groups with fewer than 3 respondents are combined to protect anonymity.
          </Text>
        </>
      )}

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 3: Rater Participation
// ========================================================================
function RaterParticipationPage({ data }: { data: ReportData }) {
  const types = Object.entries(data.results.responseRateByType);
  const totalInvited = types.reduce((s, [, v]) => s + v.invited, 0);
  const totalCompleted = types.reduce((s, [, v]) => s + v.completed, 0);
  const overallRate = totalInvited > 0 ? Math.round((totalCompleted / totalInvited) * 100) : 0;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Rater Participation</Text>

      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{totalCompleted}</Text>
          <Text style={{ fontSize: 9, color: colors.mediumGray }}>Responses Received</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{overallRate}%</Text>
          <Text style={{ fontSize: 9, color: colors.mediumGray }}>Overall Response Rate</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
            {overallRate >= 75 ? 'High' : overallRate >= 50 ? 'Moderate' : 'Low'}
          </Text>
          <Text style={{ fontSize: 9, color: colors.mediumGray }}>Data Confidence</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Rater Group</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Invited</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Completed</Text>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Response Rate</Text>
        </View>
        {types.map(([type, entry], i) => (
          <View key={type} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{raterTypeLabels[type] || type}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{entry.invited}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{entry.completed}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>{entry.rate}%</Text>
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 4: Executive Summary
// ========================================================================
function ExecutiveSummaryPage({ data }: { data: ReportData }) {
  const { results } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Overall Score */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 42, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
          {results.overallScore.toFixed(1)}
        </Text>
        <Text style={{ fontSize: 10, color: colors.mediumGray }}>
          Overall Score (out of {data.config.scaleMax})
        </Text>
      </View>

      {/* Strengths and Development Areas */}
      <View style={{ flexDirection: 'row', gap: 30, marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 8 }}>
            Top Strengths
          </Text>
          {results.strengths.map((s, i) => (
            <Text key={i} style={{ fontSize: 9, color: colors.black, marginBottom: 3 }}>• {s}</Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 8 }}>
            Development Areas
          </Text>
          {results.developmentAreas.map((d, i) => (
            <Text key={i} style={{ fontSize: 9, color: colors.black, marginBottom: 3 }}>• {d}</Text>
          ))}
        </View>
      </View>

      <View style={styles.thinRule} />

      {/* Johari Window — clean 2×2 */}
      <Text style={styles.subsectionTitle}>Johari Window</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <View style={{ flex: 1, padding: 10, borderWidth: 0.5, borderColor: colors.primary }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>Open Area</Text>
          <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 3 }}>Self ↑ Others ↑</Text>
          {results.johariWindow.openArea.map((c, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.black, marginTop: 1 }}>• {c}</Text>
          ))}
          {results.johariWindow.openArea.length === 0 && (
            <Text style={{ fontSize: 8, color: colors.lightGray, fontStyle: 'italic' }}>None</Text>
          )}
        </View>
        <View style={{ flex: 1, padding: 10, borderWidth: 0.5, borderColor: colors.primary, borderLeftWidth: 0 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>Blind Spot</Text>
          <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 3 }}>Self ↓ Others ↑</Text>
          {results.johariWindow.blindSpot.map((c, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.black, marginTop: 1 }}>• {c}</Text>
          ))}
          {results.johariWindow.blindSpot.length === 0 && (
            <Text style={{ fontSize: 8, color: colors.lightGray, fontStyle: 'italic' }}>None</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <View style={{ flex: 1, padding: 10, borderWidth: 0.5, borderColor: colors.primary, borderTopWidth: 0 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>Hidden Area</Text>
          <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 3 }}>Self ↑ Others ↓</Text>
          {results.johariWindow.hiddenArea.map((c, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.black, marginTop: 1 }}>• {c}</Text>
          ))}
          {results.johariWindow.hiddenArea.length === 0 && (
            <Text style={{ fontSize: 8, color: colors.lightGray, fontStyle: 'italic' }}>None</Text>
          )}
        </View>
        <View style={{ flex: 1, padding: 10, borderWidth: 0.5, borderColor: colors.primary, borderTopWidth: 0, borderLeftWidth: 0 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>Unknown Area</Text>
          <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 3 }}>Self ↓ Others ↓</Text>
          {results.johariWindow.unknownArea.map((c, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.black, marginTop: 1 }}>• {c}</Text>
          ))}
          {results.johariWindow.unknownArea.length === 0 && (
            <Text style={{ fontSize: 8, color: colors.lightGray, fontStyle: 'italic' }}>None</Text>
          )}
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 5: Current Ceiling (NEW)
// ========================================================================
function CurrentCeilingPage({ data }: { data: ReportData }) {
  const { results } = data;
  if (!results.currentCeiling) return null;

  return (
    <Page size="A4" style={[styles.page, { justifyContent: 'center' }]}>
      <Text style={styles.ceilingHeading}>CURRENT CEILING</Text>
      <Text style={styles.ceilingNarrative}>
        {results.currentCeiling.narrative}
      </Text>
      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 6: CCI Gauge (NEW)
// ========================================================================
function CCIGaugePage({ data }: { data: ReportData }) {
  const { results } = data;
  if (!results.cciResult) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Coaching Capacity Index</Text>

      <Text style={[styles.bodyText, { marginBottom: 20 }]}>
        The Coaching Capacity Index measures a leader's ability to develop capacity in others. It is derived from one targeted question per competency, focusing on whether the leader actively elevates the capability of those around them.
      </Text>

      <View style={{ marginBottom: 24 }}>
        <CCIGauge
          score={results.cciResult.score}
          band={results.cciResult.band}
          scaleMax={data.config.scaleMax}
          width={420}
        />
      </View>

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>CCI Item Breakdown</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Competency</Text>
          <Text style={[styles.tableHeaderCell, { width: '50%' }]}>CCI Question</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Score</Text>
        </View>
        {results.cciResult.items.map((item, i) => (
          <View key={item.questionId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>{item.competencyName}</Text>
            <Text style={[styles.tableCell, { width: '50%', fontSize: 8 }]}>{item.questionText}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{item.effectiveScore.toFixed(1)}</Text>
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 7: Competency Overview (Radar + Scores Table)
// ========================================================================
function CompetencyOverviewPage({ data }: { data: ReportData }) {
  const { results, config } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Competency Overview</Text>

      {/* Adaptive Radar Chart */}
      {results.competencyScores.length >= 3 && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <RadarChart
            competencyScores={results.competencyScores}
            scaleMax={config.scaleMax}
            assessmentType={data.assessmentType}
          />
        </View>
      )}

      {/* Score Summary Table with subtitles */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '32%' }]}>Competency</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Self</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Others</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Overall</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Gap</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>σ</Text>
        </View>
        {results.competencyScores.map((cs, i) => {
          const compDef = config.competencies.find((c) => c.id === cs.competencyId);
          return (
            <View key={cs.competencyId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={{ width: '32%' }}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                  {cs.competencyName}
                </Text>
                {compDef?.subtitle && (
                  <Text style={{ fontSize: 7, color: colors.mediumGray }}>
                    {compDef.subtitle}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {cs.selfScore?.toFixed(1) || '—'}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {cs.othersAverage.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '12%', fontFamily: 'Helvetica-Bold' }]}>
                {cs.overallAverage.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {cs.gap > 0 ? '+' : ''}{cs.gap.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {cs.raterAgreement.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 8: Scores by Rater Group (Bar Chart)
// ========================================================================
function ScoreBarChartPage({ data }: { data: ReportData }) {
  const { results, config } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Scores by Rater Group</Text>

      <HorizontalBarChart competencyScores={results.competencyScores} scaleMax={config.scaleMax} />

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 9: Detailed Competency Breakdown
// ========================================================================
function CompetencyDetailPages({ data }: { data: ReportData }) {
  const { results, config } = data;

  return (
    <>
      {results.competencyScores.map((cs) => {
        const compConfig = config.competencies.find((c) => c.id === cs.competencyId);
        const items = results.itemScores.filter((i) => i.competencyId === cs.competencyId);
        const compComments = results.comments.filter((c) => c.competencyId === cs.competencyId);

        return (
          <Page key={cs.competencyId} size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>{cs.competencyName}</Text>
            {compConfig?.subtitle && (
              <Text style={{ fontSize: 11, color: colors.mediumGray, marginBottom: 12, marginTop: -8 }}>
                {compConfig.subtitle}
              </Text>
            )}
            {compConfig?.description && (
              <Text style={[styles.bodyText, { marginBottom: 12 }]}>{compConfig.description}</Text>
            )}

            {/* Scores by rater type — simple row */}
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 20 }}>
              {Object.entries(cs.scores).map(([type, score]) => (
                <View key={type}>
                  <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{score.toFixed(1)}</Text>
                  <Text style={{ fontSize: 8, color: colors.mediumGray }}>{raterTypeLabels[type] || type}</Text>
                </View>
              ))}
            </View>

            <View style={styles.thinRule} />

            {/* Item-level scores */}
            <Text style={styles.subsectionTitle}>Item Scores</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '55%' }]}>Question</Text>
                <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Self</Text>
                <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Overall</Text>
                <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Gap</Text>
              </View>
              {items.map((item, i) => (
                <View key={item.questionId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { width: '55%', fontSize: 8 }]}>{item.questionText}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>{item.selfScore?.toFixed(1) || '—'}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>{item.overallAverage.toFixed(1)}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>
                    {item.gap > 0 ? '+' : ''}{item.gap.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Distribution */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, marginTop: 8 }}>
              <View style={{ marginRight: 20 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>
                  Response Distribution
                </Text>
                <DistributionHistogram
                  distribution={cs.responseDistribution}
                  scaleMin={config.scaleMin}
                  scaleMax={config.scaleMax}
                  width={180}
                  height={70}
                />
              </View>
              <View>
                <Text style={{ fontSize: 8, color: colors.mediumGray }}>
                  Agreement (σ): {cs.raterAgreement.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Comments */}
            {compComments.length > 0 && (
              <>
                <View style={styles.thinRule} />
                <Text style={styles.subsectionTitle}>Comments</Text>
                {compComments.map((comment, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 1 }}>
                      {raterTypeLabels[comment.raterType] || comment.raterType}
                    </Text>
                    <Text style={styles.commentText}>
                      "{comment.comment}"
                    </Text>
                  </View>
                ))}
              </>
            )}

            <PageFooter />
          </Page>
        );
      })}
    </>
  );
}

// ========================================================================
// Section 10: Gap Analysis
// ========================================================================
function GapAnalysisPage({ data }: { data: ReportData }) {
  const { results } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Gap Analysis</Text>
      <Text style={[styles.bodyText, { marginBottom: 20 }]}>
        The gap analysis shows the difference between your self-assessment and how others perceive you. Positive values indicate areas where you rate yourself higher than others. Negative values indicate areas where others rate you higher.
      </Text>

      <GapDivergenceChart gapAnalysis={results.gapAnalysis} />

      <View style={{ marginTop: 20 }}>
        {results.gapAnalysis.map((entry) => (
          <View key={entry.competencyId} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.black }}>
                {entry.competencyName}
              </Text>
              <Text style={{ fontSize: 8, color: colors.mediumGray }}>
                {entry.classification === 'blind_spot' ? 'Blind Spot'
                  : entry.classification === 'hidden_strength' ? 'Hidden Strength'
                  : 'Aligned'} ({entry.gap > 0 ? '+' : ''}{entry.gap.toFixed(1)})
              </Text>
            </View>
            <Text style={styles.mutedText}>{entry.interpretation}</Text>
            <View style={styles.thinRule} />
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 11: Top & Bottom Items
// ========================================================================
function TopBottomItemsPage({ data }: { data: ReportData }) {
  const { results } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Highest & Lowest Rated Items</Text>

      <Text style={styles.subsectionTitle}>Top 5 Highest Rated</Text>
      {results.topItems.map((item, i) => (
        <View key={`top-${i}`} style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.primary, width: 16 }}>{i + 1}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: colors.black }}>{item.questionText}</Text>
            <Text style={{ fontSize: 7, color: colors.mediumGray }}>{item.competencyName}</Text>
          </View>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.primary, width: 30, textAlign: 'right' }}>
            {item.overallAverage.toFixed(1)}
          </Text>
        </View>
      ))}

      <View style={{ marginTop: 20 }} />

      <Text style={styles.subsectionTitle}>Bottom 5 Lowest Rated</Text>
      {results.bottomItems.map((item, i) => (
        <View key={`bot-${i}`} style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.primary, width: 16 }}>{i + 1}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: colors.black }}>{item.questionText}</Text>
            <Text style={{ fontSize: 7, color: colors.mediumGray }}>{item.competencyName}</Text>
          </View>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.primary, width: 30, textAlign: 'right' }}>
            {item.overallAverage.toFixed(1)}
          </Text>
        </View>
      ))}

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 12: Open-Ended Comments
// ========================================================================
function CommentsPage({ data }: { data: ReportData }) {
  const { results, config } = data;

  const commentsByComp = new Map<string, typeof results.comments>();
  for (const c of results.comments) {
    if (!commentsByComp.has(c.competencyId)) commentsByComp.set(c.competencyId, []);
    commentsByComp.get(c.competencyId)!.push(c);
  }

  if (results.comments.length === 0) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Open-Ended Comments</Text>
      <Text style={[styles.mutedText, { marginBottom: 16 }]}>
        Comments are presented anonymously by rater group.
      </Text>

      {config.competencies.map((comp) => {
        const comments = commentsByComp.get(comp.id);
        if (!comments || comments.length === 0) return null;
        return (
          <View key={comp.id} style={{ marginBottom: 16 }}>
            <Text style={styles.subsectionTitle}>{comp.name}</Text>
            {comments.map((c, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 7, color: colors.mediumGray, marginBottom: 1 }}>
                  {raterTypeLabels[c.raterType] || c.raterType}
                </Text>
                <Text style={styles.commentText}>"{c.comment}"</Text>
              </View>
            ))}
            <View style={styles.thinRule} />
          </View>
        );
      })}

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 13: Trend Comparison (conditional)
// ========================================================================
function TrendComparisonPage({ data }: { data: ReportData }) {
  const { results } = data;
  if (!results.trend) return null;

  const { trend } = results;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Trend Comparison</Text>
      <Text style={[styles.bodyText, { marginBottom: 16 }]}>
        Comparison with your previous assessment completed on {new Date(trend.previousCompletedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
          Overall: {trend.overallChange > 0 ? '+' : ''}{trend.overallChange.toFixed(2)}
          {' '}({trend.overallDirection})
        </Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Competency</Text>
          <Text style={[styles.tableHeaderCell, { width: '17%' }]}>Previous</Text>
          <Text style={[styles.tableHeaderCell, { width: '17%' }]}>Current</Text>
          <Text style={[styles.tableHeaderCell, { width: '17%' }]}>Change</Text>
          <Text style={[styles.tableHeaderCell, { width: '19%' }]}>Direction</Text>
        </View>
        {trend.competencyChanges.map((cc, i) => (
          <View key={cc.competencyId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{cc.competencyName}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{cc.previousScore.toFixed(1)}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{cc.currentScore.toFixed(1)}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>
              {cc.change > 0 ? '+' : ''}{cc.change.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, { width: '19%', fontFamily: 'Helvetica-Bold', color: cc.direction === 'improved' ? colors.primary : cc.direction === 'declined' ? colors.darkGray : colors.mediumGray }]}>
              {cc.direction === 'improved' ? '▲ Improved' : cc.direction === 'declined' ? '▼ Declined' : '— Stable'}
            </Text>
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 14: Development Worksheet
// ========================================================================
function DevelopmentWorksheetPage({ data }: { data: ReportData }) {
  const { results } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Development Worksheet</Text>
      <Text style={[styles.bodyText, { marginBottom: 20 }]}>
        Based on your results, consider focusing on the following development areas.
      </Text>

      {results.developmentAreas.slice(0, 3).map((area, i) => (
        <View key={i} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 10 }}>
            Goal {i + 1}: {area}
          </Text>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.mediumGray, marginBottom: 4 }}>
              What will I do differently?
            </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.lightGray, paddingBottom: 18 }} />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.mediumGray, marginBottom: 4 }}>
              How will I measure success?
            </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.lightGray, paddingBottom: 18 }} />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.mediumGray, marginBottom: 4 }}>
              Target date
            </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.lightGray, paddingBottom: 12 }} />
          </View>

          {i < 2 && <View style={styles.thinRule} />}
        </View>
      ))}

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 15: Development Ecosystem
// ========================================================================
function DevelopmentEcosystemPage({ data }: { data: ReportData }) {
  const { results } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Your Development Ecosystem</Text>
      <Text style={[styles.bodyText, { marginBottom: 16 }]}>
        Your assessment results connect to the platform's broader development tools to support your growth journey.
      </Text>

      <Text style={styles.subsectionTitle}>Suggested Development Goals</Text>
      {results.developmentAreas.map((area, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
            Improve {area}
          </Text>
          <Text style={[styles.mutedText, { marginTop: 1 }]}>
            Focus on the lowest-rated items in this competency. Set specific, measurable actions.
          </Text>
        </View>
      ))}

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>Mentoring Discussion Guide</Text>
      <Text style={[styles.bodyText, { marginBottom: 4 }]}>
        Share this report with your mentor and discuss:
      </Text>
      {[
        'Which results surprised you? Which confirmed what you expected?',
        'How do the blind spots and hidden strengths relate to your current role?',
        'What specific behaviors can you practice to improve your development areas?',
        'How can your strengths be leveraged more effectively?',
        'What support do you need from your team and organization?',
      ].map((q, i) => (
        <Text key={i} style={{ fontSize: 9, color: colors.black, marginBottom: 3 }}>
          {i + 1}. {q}
        </Text>
      ))}

      <View style={styles.thinRule} />

      <Text style={styles.subsectionTitle}>Reassessment Timeline</Text>
      <Text style={styles.bodyText}>
        Plan a reassessment in 6–12 months. The platform will automatically generate a trend comparison showing your growth over time.
      </Text>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Section 16: Appendix
// ========================================================================
function AppendixPage({ data }: { data: ReportData }) {
  const { results, config } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Appendix: Full Item-Level Data</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '38%' }]}>Item</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Self</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Mgr</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Peer</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>DR</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Overall</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Gap</Text>
        </View>
        {config.competencies.map((comp) => {
          const items = results.itemScores.filter((i) => i.competencyId === comp.id);
          return [
            <View key={`header-${comp.id}`} style={[styles.tableRow, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', width: '100%', color: colors.primary }]}>
                {comp.name}
                {comp.subtitle ? ` — ${comp.subtitle}` : ''}
              </Text>
            </View>,
            ...items.map((item, i) => (
              <View key={item.questionId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { width: '38%', fontSize: 7 }]}>{item.questionText}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>{item.selfScore?.toFixed(1) || '—'}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>{item.scores.manager?.toFixed(1) || '—'}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>{item.scores.peer?.toFixed(1) || '—'}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>{item.scores.direct_report?.toFixed(1) || '—'}</Text>
                <Text style={[styles.tableCell, { width: '12%', fontFamily: 'Helvetica-Bold' }]}>{item.overallAverage.toFixed(1)}</Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>
                  {item.gap > 0 ? '+' : ''}{item.gap.toFixed(1)}
                </Text>
              </View>
            )),
          ];
        })}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 }}>Methodology</Text>
        <Text style={[styles.mutedText, { lineHeight: 1.6 }]}>
          Scores are calculated as the mean of all ratings within each rater group. The Overall score is the mean across all individual ratings. Gap = Self - Others average. Rater Agreement (σ) is the standard deviation of individual ratings (excluding self). The Johari Window classifies competencies using the scale midpoint ({(config.scaleMin + config.scaleMax) / 2}) as the threshold. Reverse-scored items are automatically inverted before computation. The Coaching Capacity Index is derived from one targeted question per competency.
        </Text>
      </View>

      <PageFooter />
    </Page>
  );
}

// ========================================================================
// Main Report Document
// ========================================================================
function AssessmentReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <CoverPage data={data} />
      <HowToReadPage data={data} />
      <RaterParticipationPage data={data} />
      <ExecutiveSummaryPage data={data} />
      <CurrentCeilingPage data={data} />
      <CCIGaugePage data={data} />
      <CompetencyOverviewPage data={data} />
      <ScoreBarChartPage data={data} />
      <CompetencyDetailPages data={data} />
      <GapAnalysisPage data={data} />
      <TopBottomItemsPage data={data} />
      <CommentsPage data={data} />
      <TrendComparisonPage data={data} />
      <DevelopmentWorksheetPage data={data} />
      <DevelopmentEcosystemPage data={data} />
      <AppendixPage data={data} />
    </Document>
  );
}

// ========================================================================
// Public API: Generate PDF buffer
// ========================================================================
export async function generateAssessmentReport(assessmentId: string): Promise<Buffer> {
  // 1. Fetch assessment
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) throw new Error(`Assessment ${assessmentId} not found`);
  if (!assessment.computedResults) throw new Error('Assessment results not computed yet');

  // 2. Fetch template
  const [template] = await db
    .select()
    .from(assessmentTemplates)
    .where(eq(assessmentTemplates.id, assessment.templateId))
    .limit(1);

  if (!template) throw new Error(`Template ${assessment.templateId} not found`);

  // 3. Fetch subject
  const [subject] = await db
    .select({ firstName: users.firstName, lastName: users.lastName, title: users.title })
    .from(users)
    .where(eq(users.id, assessment.subjectId))
    .limit(1);

  // 4. Build report data
  const reportData: ReportData = {
    assessmentName: assessment.name,
    subjectName: subject ? `${subject.firstName} ${subject.lastName}` : 'Unknown',
    subjectTitle: subject?.title || '',
    templateName: template.name,
    assessmentType: template.assessmentType as '180' | '360' | 'custom',
    completedAt: assessment.updatedAt.toISOString(),
    config: template.config as TemplateConfig,
    results: assessment.computedResults as ComputedAssessmentResults,
  };

  // 5. Render PDF
  const pdfBuffer = await renderToBuffer(
    React.createElement(AssessmentReportDocument, { data: reportData }) as any
  );

  return Buffer.from(pdfBuffer);
}

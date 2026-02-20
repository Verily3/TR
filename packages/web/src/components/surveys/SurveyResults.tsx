'use client';

import type {
  SurveyResults as SurveyResultsData,
  SurveyQuestionResult,
  ChoiceResult,
  RatingResult,
  NpsResult,
  RankingItem,
} from '@/types/surveys';

// ── Bar chart ─────────────────────────────────────────────────────────────────

function HorizontalBar({ percent, label, count }: { percent: number; label: string; count: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[200px]">{label}</span>
        <span className="ml-2 flex-shrink-0">{count} ({percent}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
          aria-label={`${percent}%`}
        />
      </div>
    </div>
  );
}

// ── NPS gauge ────────────────────────────────────────────────────────────────

function NpsDisplay({ data, total }: { data: NpsResult; total: number }) {
  const promoterPct = total > 0 ? Math.round((data.promoters / total) * 100) : 0;
  const passivePct = total > 0 ? Math.round((data.passives / total) * 100) : 0;
  const detractorPct = total > 0 ? Math.round((data.detractors / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div
            className={`text-5xl font-bold mb-1 ${
              data.npsScore >= 50
                ? 'text-green-600'
                : data.npsScore >= 0
                  ? 'text-amber-600'
                  : 'text-red-600'
            }`}
          >
            {data.npsScore > 0 ? '+' : ''}{data.npsScore}
          </div>
          <p className="text-xs text-muted-foreground">NPS Score</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-700">{promoterPct}%</div>
          <div className="text-xs text-green-600">Promoters</div>
          <div className="text-xs text-muted-foreground">(9–10)</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-lg font-bold text-amber-700">{passivePct}%</div>
          <div className="text-xs text-amber-600">Passives</div>
          <div className="text-xs text-muted-foreground">(7–8)</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-lg font-bold text-red-700">{detractorPct}%</div>
          <div className="text-xs text-red-600">Detractors</div>
          <div className="text-xs text-muted-foreground">(0–6)</div>
        </div>
      </div>
    </div>
  );
}

// ── Rating display ─────────────────────────────────────────────────────────────

function RatingDisplay({ data }: { data: RatingResult }) {
  const max = Math.max(...data.distribution.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      <div className="text-center pb-2">
        <span className="text-3xl font-bold text-sidebar-foreground">{data.average}</span>
        <span className="text-muted-foreground text-sm"> avg</span>
      </div>
      <div className="space-y-1.5">
        {data.distribution.map((d) => (
          <div key={d.value} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-6 text-right flex-shrink-0">{d.value}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: max > 0 ? `${(d.count / max) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 flex-shrink-0">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Per question block ────────────────────────────────────────────────────────

function QuestionResultBlock({ result, idx }: { result: SurveyQuestionResult; idx: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">Question {idx + 1}</p>
        <h4 className="text-sm font-semibold text-sidebar-foreground">{result.text}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{result.totalAnswers} response{result.totalAnswers !== 1 ? 's' : ''}</p>
      </div>

      {result.totalAnswers === 0 ? (
        <p className="text-sm text-muted-foreground italic">No responses yet</p>
      ) : (
        <>
          {/* single_choice, multiple_choice, yes_no */}
          {(result.type === 'single_choice' || result.type === 'multiple_choice' || result.type === 'yes_no') &&
            Array.isArray(result.data) && (result.data as ChoiceResult[]).length > 0 && (
              <div className="space-y-2">
                {(result.data as ChoiceResult[]).map((item) => (
                  <HorizontalBar key={item.label} label={item.label} count={item.count} percent={item.percent} />
                ))}
              </div>
            )}

          {/* rating */}
          {result.type === 'rating' && result.data && !Array.isArray(result.data) && (result.data as RatingResult).distribution && (
            <RatingDisplay data={result.data as RatingResult} />
          )}

          {/* nps */}
          {result.type === 'nps' && result.data && (
            <NpsDisplay data={result.data as NpsResult} total={result.totalAnswers} />
          )}

          {/* text */}
          {result.type === 'text' && result.data && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {((result.data as { responses: string[] }).responses ?? []).map((resp, i) => (
                <div key={i} className="text-sm text-sidebar-foreground bg-muted/30 px-3 py-2 rounded-lg">
                  {resp}
                </div>
              ))}
            </div>
          )}

          {/* ranking */}
          {result.type === 'ranking' && Array.isArray(result.data) && (
            <div className="space-y-1.5">
              {(result.data as RankingItem[]).map((item, i) => (
                <div key={item.item} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sidebar-foreground truncate">{item.item}</span>
                  <span className="text-xs text-muted-foreground">avg rank: {item.avgRank}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SurveyResults({ results }: { results: SurveyResultsData }) {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-sidebar-foreground text-lg">{results.totalResponses}</span>{' '}
          total response{results.totalResponses !== 1 ? 's' : ''}
        </span>
      </div>
      {results.questions.map((q, idx) => (
        <QuestionResultBlock key={q.questionId} result={q} idx={idx} />
      ))}
    </div>
  );
}

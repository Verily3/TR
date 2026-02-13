import React from 'react';
import { Svg, Circle, Line, Polygon, Rect, Text as SvgText, G } from '@react-pdf/renderer';
import { colors } from './shared-styles.js';
import type { ComputedCompetencyScore, GapEntry } from '@tr/db/schema';

/**
 * Adaptive Radar Chart — LeaderShift™ minimal style
 *
 * - 180-degree: Self (solid navy) vs Boss/Manager (dashed navy)
 * - 360-degree: Self (solid navy), Others (dashed navy), Manager (dotted navy)
 * - Thin grid, no fills, clean labels
 */
export function RadarChart({
  competencyScores,
  scaleMax,
  assessmentType = '360',
  width = 280,
  height = 280,
}: {
  competencyScores: ComputedCompetencyScore[];
  scaleMax: number;
  assessmentType?: '180' | '360' | 'custom';
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 35;
  const n = competencyScores.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;

  // Grid circles (concentric rings at 20% intervals)
  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1.0].map((frac, i) =>
    React.createElement(Circle, {
      key: `grid-${i}`,
      cx,
      cy,
      r: radius * frac,
      fill: 'none',
      stroke: colors.lightGray,
      strokeWidth: 0.5,
    })
  );

  // Scale labels on first axis
  const scaleLabels = [0.2, 0.4, 0.6, 0.8, 1.0].map((frac, i) =>
    React.createElement(SvgText, {
      key: `scale-${i}`,
      x: cx + 3,
      y: cy - radius * frac - 2,
      style: { fontSize: 6, fill: colors.mediumGray },
    }, `${(frac * scaleMax).toFixed(1)}`)
  );

  // Axis lines + labels
  const axes = competencyScores.map((comp, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy + radius * Math.sin(angle);
    const labelX = cx + (radius + 20) * Math.cos(angle);
    const labelY = cy + (radius + 20) * Math.sin(angle);

    const label = comp.competencyName.length > 16
      ? comp.competencyName.substring(0, 14) + '...'
      : comp.competencyName;

    return React.createElement(G, { key: `axis-${i}` },
      React.createElement(Line, {
        x1: cx, y1: cy, x2, y2,
        stroke: colors.primary,
        strokeWidth: 0.5,
        opacity: 0.4,
      }),
      React.createElement(SvgText, {
        x: labelX,
        y: labelY + 3,
        textAnchor: 'middle',
        style: { fontSize: 7, fill: colors.darkGray, fontFamily: 'Helvetica-Bold' },
      }, label)
    );
  });

  // Polygon point builder
  function buildPolygonPoints(getValue: (cs: ComputedCompetencyScore) => number | null): string {
    return competencyScores
      .map((cs, i) => {
        const val = getValue(cs);
        if (val == null) return `${cx},${cy}`;
        const frac = Math.min(val / scaleMax, 1);
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + radius * frac * Math.cos(angle);
        const y = cy + radius * frac * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  }

  const polygons: React.ReactElement[] = [];
  const legendItems: { label: string; dash: string; y: number }[] = [];

  if (assessmentType === '180') {
    // 180: Self (solid) vs Manager/Boss (dashed)
    polygons.push(
      React.createElement(Polygon, {
        key: 'manager-poly',
        points: buildPolygonPoints((cs) => cs.scores['manager'] ?? null),
        fill: 'none',
        stroke: colors.primary,
        strokeWidth: 1.5,
        strokeDasharray: '4,3',
      }),
      React.createElement(Polygon, {
        key: 'self-poly',
        points: buildPolygonPoints((cs) => cs.selfScore),
        fill: 'none',
        stroke: colors.primary,
        strokeWidth: 2,
      })
    );
    legendItems.push(
      { label: 'Self', dash: '', y: 0 },
      { label: 'Boss', dash: '4,3', y: 14 },
    );
  } else {
    // 360: Self (solid), Others avg (dashed), optionally Manager (dotted)
    const hasManager = competencyScores.some((cs) => cs.scores['manager'] != null);

    polygons.push(
      React.createElement(Polygon, {
        key: 'others-poly',
        points: buildPolygonPoints((cs) => cs.othersAverage),
        fill: 'none',
        stroke: colors.primary,
        strokeWidth: 1.5,
        strokeDasharray: '4,3',
      })
    );

    if (hasManager) {
      polygons.push(
        React.createElement(Polygon, {
          key: 'manager-poly',
          points: buildPolygonPoints((cs) => cs.scores['manager'] ?? null),
          fill: 'none',
          stroke: colors.primary,
          strokeWidth: 1,
          strokeDasharray: '1,2',
          opacity: 0.6,
        })
      );
    }

    polygons.push(
      React.createElement(Polygon, {
        key: 'self-poly',
        points: buildPolygonPoints((cs) => cs.selfScore),
        fill: 'none',
        stroke: colors.primary,
        strokeWidth: 2,
      })
    );

    legendItems.push(
      { label: 'Self', dash: '', y: 0 },
      { label: 'Others', dash: '4,3', y: 14 },
    );
    if (hasManager) {
      legendItems.push({ label: 'Manager', dash: '1,2', y: 28 });
    }
  }

  // Legend
  const legend = React.createElement(G, { key: 'legend' },
    ...legendItems.map((item, i) =>
      React.createElement(G, { key: `legend-${i}` },
        React.createElement(Line, {
          x1: 8, y1: height - 20 + item.y,
          x2: 28, y2: height - 20 + item.y,
          stroke: colors.primary,
          strokeWidth: item.dash ? 1.5 : 2,
          strokeDasharray: item.dash || undefined,
        }),
        React.createElement(SvgText, {
          x: 32, y: height - 17 + item.y,
          style: { fontSize: 7, fill: colors.darkGray },
        }, item.label)
      )
    )
  );

  return React.createElement(Svg, { width, height: height + legendItems.length * 14 },
    ...gridCircles,
    ...scaleLabels,
    ...axes,
    ...polygons,
    legend
  );
}

/**
 * Horizontal bar chart — competency scores, monochrome navy
 * Navy fill at varying opacity per rater type
 */
export function HorizontalBarChart({
  competencyScores,
  scaleMax,
  width = 480,
}: {
  competencyScores: ComputedCompetencyScore[];
  scaleMax: number;
  width?: number;
}) {
  const barHeight = 12;
  const groupGap = 20;
  const labelWidth = 120;
  const barArea = width - labelWidth - 30;

  // Determine which rater types have data
  const raterTypes: string[] = [];
  const seen = new Set<string>();
  for (const comp of competencyScores) {
    for (const rt of Object.keys(comp.scores)) {
      if (!seen.has(rt)) {
        seen.add(rt);
        raterTypes.push(rt);
      }
    }
  }

  // Opacity map: self=100%, manager=75%, peer=55%, direct_report=40%
  const opacityMap: Record<string, number> = {
    self: 1.0,
    manager: 0.75,
    peer: 0.55,
    direct_report: 0.4,
  };

  const totalHeight = competencyScores.length * (raterTypes.length * (barHeight + 2) + groupGap) + 10;
  const elements: React.ReactElement[] = [];
  let yOffset = 10;

  for (const comp of competencyScores) {
    // Competency label
    elements.push(
      React.createElement(SvgText, {
        key: `label-${comp.competencyId}`,
        x: 0, y: yOffset + 8,
        style: { fontSize: 8, fontFamily: 'Helvetica-Bold', fill: colors.black },
      }, comp.competencyName.length > 22 ? comp.competencyName.substring(0, 20) + '...' : comp.competencyName)
    );
    yOffset += 14;

    raterTypes.forEach((type) => {
      const score = comp.scores[type];
      if (score == null) return;

      const barWidth = Math.max((score / scaleMax) * barArea, 1);
      const opacity = opacityMap[type] ?? 0.5;

      elements.push(
        React.createElement(Rect, {
          key: `bar-${comp.competencyId}-${type}`,
          x: labelWidth,
          y: yOffset,
          width: barWidth,
          height: barHeight - 2,
          fill: colors.primary,
          opacity,
          rx: 1,
        }),
        React.createElement(SvgText, {
          key: `score-${comp.competencyId}-${type}`,
          x: labelWidth + barWidth + 4,
          y: yOffset + barHeight - 3,
          style: { fontSize: 7, fill: colors.mediumGray },
        }, score.toFixed(1)),
        React.createElement(SvgText, {
          key: `typelabel-${comp.competencyId}-${type}`,
          x: labelWidth - 4,
          y: yOffset + barHeight - 3,
          textAnchor: 'end',
          style: { fontSize: 7, fill: colors.mediumGray },
        }, type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '))
      );

      yOffset += barHeight + 2;
    });

    yOffset += groupGap - 8;
  }

  return React.createElement(Svg, { width, height: totalHeight }, ...elements);
}

/**
 * CCI Gauge — simple horizontal bar
 * "Coaching Capacity Index" label. Score left, band right. Minimalist.
 */
export function CCIGauge({
  score,
  band,
  scaleMax = 5,
  width = 400,
}: {
  score: number;
  band: string;
  scaleMax?: number;
  width?: number;
}) {
  const barHeight = 16;
  const barY = 30;
  const barWidth = width - 80;
  const fillWidth = Math.min(score / scaleMax, 1) * barWidth;

  return React.createElement(Svg, { width, height: 70 },
    // Label
    React.createElement(SvgText, {
      x: 0, y: 14,
      style: { fontSize: 10, fontFamily: 'Helvetica-Bold', fill: colors.primary },
    }, 'Coaching Capacity Index'),

    // Background bar
    React.createElement(Rect, {
      x: 40, y: barY,
      width: barWidth, height: barHeight,
      fill: colors.veryLightGray,
      rx: 2,
    }),

    // Fill bar
    React.createElement(Rect, {
      x: 40, y: barY,
      width: fillWidth, height: barHeight,
      fill: colors.primary,
      rx: 2,
    }),

    // Score on left
    React.createElement(SvgText, {
      x: 0, y: barY + 12,
      style: { fontSize: 14, fontFamily: 'Helvetica-Bold', fill: colors.primary },
    }, score.toFixed(1)),

    // Band label on right
    React.createElement(SvgText, {
      x: 40 + barWidth + 8, y: barY + 12,
      style: { fontSize: 10, fontFamily: 'Helvetica-Bold', fill: colors.darkGray },
    }, band)
  );
}

/**
 * Gap analysis divergence chart — navy/gray monochrome
 */
export function GapDivergenceChart({
  gapAnalysis,
  width = 480,
}: {
  gapAnalysis: GapEntry[];
  width?: number;
}) {
  const rowHeight = 28;
  const labelWidth = 130;
  const barArea = width - labelWidth - 60;
  const centerX = labelWidth + barArea / 2;
  const maxGap = 2;

  const height = gapAnalysis.length * rowHeight + 30;
  const elements: React.ReactElement[] = [];

  // Center line
  elements.push(
    React.createElement(Line, {
      key: 'center',
      x1: centerX, y1: 10,
      x2: centerX, y2: height - 20,
      stroke: colors.lightGray,
      strokeWidth: 0.5,
      strokeDasharray: '3,3',
    })
  );

  // Headers
  elements.push(
    React.createElement(SvgText, {
      key: 'header-blind', x: centerX + 20, y: 8,
      style: { fontSize: 7, fill: colors.primary, fontFamily: 'Helvetica-Bold' },
    }, 'Self > Others'),
    React.createElement(SvgText, {
      key: 'header-hidden', x: centerX - 20, y: 8,
      textAnchor: 'end',
      style: { fontSize: 7, fill: colors.mediumGray, fontFamily: 'Helvetica-Bold' },
    }, 'Others > Self')
  );

  gapAnalysis.forEach((entry, i) => {
    const y = 20 + i * rowHeight;
    const gapWidth = Math.min(Math.abs(entry.gap) / maxGap, 1) * (barArea / 2);
    const isPositive = entry.gap > 0;

    // Label
    elements.push(
      React.createElement(SvgText, {
        key: `label-${i}`,
        x: 0, y: y + 12,
        style: { fontSize: 8, fill: colors.black },
      }, entry.competencyName.length > 22 ? entry.competencyName.substring(0, 20) + '...' : entry.competencyName)
    );

    // Bar — navy for positive (self > others), light gray for negative
    const barColor = isPositive ? colors.primary : colors.lightGray;
    const barX = isPositive ? centerX : centerX - gapWidth;

    elements.push(
      React.createElement(Rect, {
        key: `bar-${i}`,
        x: barX,
        y: y + 4,
        width: Math.max(gapWidth, 1),
        height: 14,
        fill: barColor,
        opacity: isPositive ? 0.8 : 1,
        rx: 1,
      }),
      React.createElement(SvgText, {
        key: `gap-${i}`,
        x: isPositive ? barX + gapWidth + 4 : barX - 4,
        y: y + 14,
        textAnchor: isPositive ? 'start' : 'end',
        style: { fontSize: 7, fill: colors.darkGray, fontFamily: 'Helvetica-Bold' },
      }, `${entry.gap > 0 ? '+' : ''}${entry.gap.toFixed(1)}`)
    );
  });

  return React.createElement(Svg, { width, height }, ...elements);
}

/**
 * Simple distribution histogram — monochrome navy bars
 */
export function DistributionHistogram({
  distribution,
  scaleMin = 1,
  scaleMax = 5,
  width = 200,
  height = 80,
}: {
  distribution: Record<number, number>;
  scaleMin?: number;
  scaleMax?: number;
  width?: number;
  height?: number;
}) {
  const range = scaleMax - scaleMin + 1;
  const barWidth = (width - 20) / range;
  const maxCount = Math.max(...Object.values(distribution), 1);
  const chartHeight = height - 20;

  const elements: React.ReactElement[] = [];

  for (let i = scaleMin; i <= scaleMax; i++) {
    const count = distribution[i] || 0;
    const barH = (count / maxCount) * chartHeight;
    const x = (i - scaleMin) * barWidth + 10;

    elements.push(
      React.createElement(Rect, {
        key: `bar-${i}`,
        x,
        y: chartHeight - barH,
        width: barWidth - 4,
        height: barH,
        fill: colors.primary,
        opacity: 0.7,
        rx: 1,
      }),
      React.createElement(SvgText, {
        key: `label-${i}`,
        x: x + (barWidth - 4) / 2,
        y: height - 4,
        textAnchor: 'middle',
        style: { fontSize: 7, fill: colors.mediumGray },
      }, `${i}`)
    );

    if (count > 0) {
      elements.push(
        React.createElement(SvgText, {
          key: `count-${i}`,
          x: x + (barWidth - 4) / 2,
          y: chartHeight - barH - 3,
          textAnchor: 'middle',
          style: { fontSize: 6, fill: colors.darkGray },
        }, `${count}`)
      );
    }
  }

  return React.createElement(Svg, { width, height }, ...elements);
}

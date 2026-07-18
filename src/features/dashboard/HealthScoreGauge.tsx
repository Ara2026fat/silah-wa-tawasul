import { DASHBOARD_MODES, type DashboardMode } from './modes';
import type { HealthScore } from './dashboardMetrics';

interface HealthScoreGaugeProps {
  mode: DashboardMode;
  score: HealthScore;
}

const SIZE = 200;
const STROKE = 16;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE;
const START_ANGLE = -220; // degrees, speedometer-style sweep
const SWEEP = 260;

function polarToCartesian(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

function arcPath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function HealthScoreGauge({ mode, score }: HealthScoreGaugeProps) {
  const meta = DASHBOARD_MODES[mode];
  const gradientId = `gauge-gradient-${mode}`;
  const value = score.value ?? 0;
  const progressAngle = START_ANGLE + (SWEEP * value) / 100;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={SIZE}
        height={SIZE * 0.85}
        viewBox={`0 0 ${SIZE} ${SIZE * 0.85}`}
        role="img"
        aria-label={
          score.value !== null
            ? `قوة الصلة: ${score.value} من 100، بناءً على ${score.scheduledCount} جهة اتصال لديها تذكير مجدول`
            : 'قوة الصلة: لا توجد تذكيرات مجدولة بعد'
        }
      >
        <title>قوة الصلة</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={meta.accent.gaugeFrom} />
            <stop offset="100%" stopColor={meta.accent.gaugeTo} />
          </linearGradient>
        </defs>

        {/* Track: uses currentColor so it follows light/dark text tokens */}
        <path
          d={arcPath(START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-sand-300 dark:text-night-line"
        />

        {score.value !== null && (
          <path
            d={arcPath(START_ANGLE, progressAngle)}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        )}

        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          className="font-display fill-current text-ink-600 dark:text-mist-100"
          fontSize="34"
          fontWeight={800}
        >
          {score.value ?? '—'}
        </text>
        <text
          x={CENTER}
          y={CENTER + 20}
          textAnchor="middle"
          className="fill-current text-ink-400 dark:text-mist-500"
          fontSize="13"
        >
          {score.value !== null ? `من أصل ${score.scheduledCount}` : 'بلا تذكيرات مجدولة'}
        </text>
      </svg>
      <p className="-mt-2 text-sm font-bold text-ink-600 dark:text-mist-100">قوة الصلة</p>
    </div>
  );
}

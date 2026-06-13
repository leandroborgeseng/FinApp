import React from 'react';
import { useContainerWidth } from '../hooks/useContainerWidth.js';
// charts.jsx — SVG chart primitives

function ChartBox({ height, minWidth = 200, style, children }) {
  const ref = React.useRef(null);
  const width = useContainerWidth(ref, minWidth);
  return (
    <div ref={ref} style={{ width: '100%', lineHeight: 0, ...style }}>
      {width > 0 && children(width, height)}
    </div>
  );
}

function SparkLine({ data, width = 200, height = 48, color = '#2563EB' }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => typeof d === 'number' ? d : d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pad = 3, w = width - pad * 2, h = height - pad * 2;
  const pts = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * w,
    pad + h - ((v - min) / range) * h
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const fill = `${line}L${pts[pts.length-1][0].toFixed(1)},${(pad+h).toFixed(1)}L${pad},${(pad+h).toFixed(1)}Z`;
  const uid = `sg${color.replace('#','')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${uid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
    </svg>
  );
}

function BarChart({ data, width = 320, height = 130 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.flatMap(d => [d.income, d.expense])) * 1.05;
  const pL = 8, pR = 8, pT = 8, pB = 22;
  const cW = width - pL - pR, cH = height - pT - pB;
  const gW = cW / data.length;
  const bW = Math.min(gW * 0.3, 11);

  const netPts = data.map((d, i) => {
    const x = pL + i * gW + gW / 2;
    const y = pT + cH - ((d.income - d.expense) / max) * cH;
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join('');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={pL} y1={pT+cH} x2={width-pR} y2={pT+cH} stroke="var(--chart-grid)" strokeWidth="1"/>
      {[0.5].map(f => (
        <line key={f} x1={pL} y1={pT+cH*(1-f)} x2={width-pR} y2={pT+cH*(1-f)} stroke="var(--chart-grid)" strokeWidth="0.5" strokeDasharray="3,3"/>
      ))}
      {data.map((d, i) => {
        const cx = pL + i * gW + gW / 2;
        const iH = (d.income / max) * cH;
        const eH = (d.expense / max) * cH;
        return (
          <g key={i}>
            <rect x={cx - bW - 1} y={pT+cH-iH} width={bW} height={iH} rx="2.5" fill="#22C55E" opacity="0.8"/>
            <rect x={cx + 1} y={pT+cH-eH} width={bW} height={eH} rx="2.5" fill="#EF4444" opacity="0.65"/>
            <text x={cx} y={height - 5} textAnchor="middle" fontSize="7.5" fill="var(--chart-label)" fontFamily="DM Sans, system-ui">{d.label}</text>
          </g>
        );
      })}
      <path d={netPts} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3,2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AreaChart({ data, width = 320, height = 130, goalValue, goalLabel, color = '#2563EB' }) {
  if (!data?.length || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const maxRaw = Math.max(...vals, goalValue || 0);
  const max = maxRaw * 1.1;
  const pL = 38, pR = 10, pT = 10, pB = 20;
  const cW = width - pL - pR, cH = height - pT - pB;
  const px = (i) => pL + (i / (data.length - 1)) * cW;
  const py = (v) => pT + cH - (v / max) * cH;
  const pts = data.map((d, i) => [px(i), py(d.value)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const fillPath = `${line}L${pts[pts.length-1][0].toFixed(1)},${(pT+cH).toFixed(1)}L${pL},${(pT+cH).toFixed(1)}Z`;
  const goalY = goalValue ? py(goalValue) : null;
  const step = Math.max(1, Math.ceil(data.length / 5));
  const uid = `ag${color.replace('#','')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      {[0.33, 0.66, 1].map(f => (
        <line key={f} x1={pL} y1={py(max*f)} x2={width-pR} y2={py(max*f)} stroke="var(--chart-grid)" strokeWidth="0.8"/>
      ))}
      {goalY !== null && goalY !== undefined && (
        <>
          <line x1={pL} y1={goalY} x2={width-pR} y2={goalY} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,3"/>
          {goalLabel && <text x={width-pR-2} y={goalY - 3} textAnchor="end" fontSize="7" fill="#F59E0B" fontFamily="DM Sans, system-ui">{goalLabel}</text>}
        </>
      )}
      <path d={fillPath} fill={`url(#${uid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color}/>
      {[0.33, 0.66, 1].map(f => (
        <text key={f} x={pL-4} y={py(max*f)+3} textAnchor="end" fontSize="7" fill="var(--chart-label)" fontFamily="DM Sans, system-ui">{fmtShort(max*f)}</text>
      ))}
      {data.map((d, i) => (i % step === 0 || i === data.length - 1) && (
        <text key={i} x={px(i)} y={height - 4} textAnchor="middle" fontSize="7.5" fill="var(--chart-label)" fontFamily="DM Sans, system-ui">{d.year || d.label}</text>
      ))}
    </svg>
  );
}

function CashFlowStepChart({ events, startBalance = 0, width = 320, height = 130, daysInMonth = 31, todayDay = null }) {
  if (!events?.length) return null;
  const sorted = [...events].sort((a, b) => a.day - b.day);
  const lastDay = daysInMonth;

  // Build step points: [{ day, balance, type }]
  const steps = [{ day: 0, balance: startBalance, type: null }];
  let running = startBalance;
  for (const e of sorted) {
    const delta = e.type === 'income' ? e.value : -e.value;
    running += delta;
    steps.push({ day: e.day, balance: running, type: e.type, desc: e.desc, value: e.value });
  }
  if (steps[steps.length - 1].day < lastDay)
    steps.push({ day: lastDay, balance: running, type: null });

  const balances   = steps.map(s => s.balance);
  const minB       = Math.min(...balances);
  const maxB       = Math.max(...balances);
  const pad        = Math.max((maxB - minB) * 0.15, 5000);
  const lo = minB - pad, hi = maxB + pad;
  const range      = hi - lo || 1;

  const pL = 46, pR = 10, pT = 10, pB = 24;
  const cW = width - pL - pR, cH = height - pT - pB;
  const px = d  => pL + (d / lastDay) * cW;
  const py = b  => pT + cH - ((b - lo) / range) * cH;

  // Step path (horizontal first, then vertical)
  let linePath = `M${px(steps[0].day).toFixed(1)},${py(steps[0].balance).toFixed(1)}`;
  for (let i = 1; i < steps.length; i++) {
    linePath += `H${px(steps[i].day).toFixed(1)}V${py(steps[i].balance).toFixed(1)}`;
  }
  const fillPath = `${linePath}H${px(lastDay).toFixed(1)}V${(pT + cH).toFixed(1)}H${pL}Z`;

  const eventSteps = steps.filter(s => s.type);
  const yTicks = [minB, (minB + maxB) / 2, maxB];
  const uid = `csf${Math.round(startBalance)}`;

  const showToday = todayDay != null && todayDay >= 1 && todayDay <= lastDay;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01"/>
        </linearGradient>
        <clipPath id={`cp${uid}`}>
          <rect x={pL} y={pT} width={cW} height={cH + 1}/>
        </clipPath>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pL} y1={py(t)} x2={width - pR} y2={py(t)} stroke="var(--chart-grid)" strokeWidth="0.8"/>
          <text x={pL - 4} y={py(t) + 3} textAnchor="end" fontSize="7" fill="var(--chart-label)" fontFamily="DM Sans, system-ui">
            {fmtShort(t)}
          </text>
        </g>
      ))}

      {/* Today marker */}
      {showToday && (
        <>
          <line x1={px(todayDay)} y1={pT} x2={px(todayDay)} y2={pT + cH} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.8"/>
          <text x={px(todayDay)} y={pT - 2} textAnchor="middle" fontSize="7" fill="#F59E0B" fontFamily="DM Sans, system-ui">hoje</text>
        </>
      )}

      {/* Fill area */}
      <path d={fillPath} fill={`url(#${uid})`} clipPath={`url(#cp${uid})`}/>

      {/* Step line */}
      <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" clipPath={`url(#cp${uid})`}/>

      {/* Event dots + vertical day ticks */}
      {eventSteps.map((s, i) => {
        const col = s.type === 'income' ? '#22C55E' : s.type === 'transfer' ? '#2563EB' : '#EF4444';
        return (
          <g key={i}>
            <line x1={px(s.day)} y1={pT + cH - 6} x2={px(s.day)} y2={pT + cH + 4} stroke="var(--chart-grid)" strokeWidth="1"/>
            <circle cx={px(s.day)} cy={py(s.balance)} r="4.5" fill={col} stroke="white" strokeWidth="1.5"/>
            <text x={px(s.day)} y={height - 5} textAnchor="middle" fontSize="7.5" fill="var(--chart-label)" fontFamily="DM Sans, system-ui">{s.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtShort(v) {
  if (Math.abs(v) >= 1000000) return `${(v/1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${(v/1000).toFixed(0)}k`;
  return `${v}`;
}

function DonutChart({ segments, size = 200, thickness = 30 }) {
  const pos   = (segments || []).filter(s => s.value > 0);
  const total = pos.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r  = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const GAP = 3;
  const toXY = (deg) => ({
    x: cx + r * Math.cos((deg - 90) * Math.PI / 180),
    y: cy + r * Math.sin((deg - 90) * Math.PI / 180),
  });
  const arc = (sa, sw) => {
    if (sw < 0.5) return '';
    const ea = sa + sw;
    const p1 = toXY(sa), p2 = toXY(ea);
    const large = sw > 180 ? 1 : 0;
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  };
  let angle = 0;
  const arcs = pos.map(s => {
    const full = (s.value / total) * 360;
    const sa = angle + GAP / 2;
    const sw = Math.max(0, full - GAP);
    angle += full;
    return { ...s, sa, sw };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F1F5" strokeWidth={thickness}/>
      {arcs.map((a, i) => (
        <path key={i} d={arc(a.sa, a.sw)} fill="none" stroke={a.color} strokeWidth={thickness} strokeLinecap="round"/>
      ))}
    </svg>
  );
}

export { SparkLine, BarChart, AreaChart, CashFlowStepChart, DonutChart, ChartBox, fmtShort };

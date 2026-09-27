import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import mapData from './mapData.json';
import {events, kings, labels, ORIGINS, SUBTITLE, TITLE, type King} from './data';
import {C, caps, serif} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Fade a scene in over its first frames and out over its last.
const useSceneFade = (inFrames = 12, outFrames = 12) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return Math.min(
    interpolate(frame, [0, inFrames], [0, 1], clamp),
    interpolate(frame, [durationInFrames - outFrames, durationInFrames], [1, 0], clamp),
  );
};

const Backdrop: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 45% 50%, #17110b 0%, ${C.bg} 70%)`}}>
    {children}
  </AbsoluteFill>
);

// Opening: three lines, one at a time.
export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneFade(1, 18);
  const lines = ['Ten rulers.', 'Seven centuries.', 'One subcontinent.'];
  return (
    <Backdrop>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity}}>
        {lines.map((line, i) => {
          const start = 10 + i * 28;
          const o = interpolate(frame, [start, start + 16], [0, 1], clamp);
          const y = interpolate(frame, [start, start + 16], [18, 0], {...clamp, easing: Easing.out(Easing.cubic)});
          return (
            <div key={line} style={{fontFamily: serif, fontWeight: 500, fontSize: 84, color: C.ink, opacity: o, transform: `translateY(${y}px)`, lineHeight: 1.25}}>
              {line}
            </div>
          );
        })}
      </AbsoluteFill>
    </Backdrop>
  );
};

// Map: kingdoms appear in reign order; arcs show the collisions between them.
export const MAP_INTRO = 24;
export const MAP_SLOT = 27;
export const MAP_OUTRO = 50;
export const MAP_DURATION = MAP_INTRO + events.length * MAP_SLOT + MAP_OUTRO;

type XY = [number, number];
const places = mapData.places as Record<string, XY>;

const arcGeometry = (from: XY, to: XY, bend: number) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  const at = (t: number): XY => [
    (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2,
    (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2,
  ];
  let length = 0;
  let prev = at(0);
  for (let i = 1; i <= 48; i++) {
    const p = at(i / 48);
    length += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return {d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, at, length};
};

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneFade(14, 18);
  const startOf = (i: number) => MAP_INTRO + i * MAP_SLOT;

  // Year counter: glide from one event's year to the next at the start of each slot.
  const index = Math.max(0, Math.min(events.length - 1, Math.floor((frame - MAP_INTRO) / MAP_SLOT)));
  const fromYear = index === 0 ? 1000 : events[index - 1].year;
  const year = Math.round(
    interpolate(frame, [startOf(index), startOf(index) + 14], [fromYear, events[index].year], {...clamp, easing: Easing.inOut(Easing.quad)}),
  );

  const landOpacity = interpolate(frame, [0, MAP_INTRO + 6], [0, 1], clamp);
  const shown = events.map((e, i) => ({e, i, start: startOf(i)})).filter(({start}) => frame >= start);
  const kingRows = shown.filter(({e}) => e.kind === 'king');
  const placesShown = new Set<string>();
  for (const {e} of shown) {
    if (e.kind === 'king') placesShown.add(kings[e.king].place);
    else placesShown.add(e.from);
  }

  return (
    <Backdrop>
      <AbsoluteFill style={{opacity}}>
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <path d={mapData.land} fill={C.land} stroke={C.coast} strokeWidth={1.2} opacity={landOpacity} />
          {shown.map(({e, i, start}) => {
            if (e.kind !== 'arc') return null;
            const g = arcGeometry(places[e.from], places[e.to], e.bend);
            const t = interpolate(frame, [start, start + 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
            const settled = interpolate(frame, [start + 30, start + 50], [1, 0.55], clamp);
            const [hx, hy] = g.at(t);
            return (
              <g key={i} opacity={settled}>
                <path d={g.d} fill="none" stroke={C.blood} strokeWidth={3} strokeLinecap="round" strokeDasharray={g.length} strokeDashoffset={g.length * (1 - t)} />
                {t < 1 ? <circle cx={hx} cy={hy} r={6} fill={C.blood} /> : null}
              </g>
            );
          })}
          {shown.map(({e, i, start}) => {
            if (e.kind !== 'king') return null;
            const [x, y] = places[kings[e.king].place];
            const pulse = interpolate(frame, [start, start + 24], [0, 1], clamp);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={8 + pulse * 26} fill="none" stroke={C.gold} strokeWidth={2} opacity={1 - pulse} />
                <circle cx={x} cy={y} r={interpolate(frame, [start, start + 8], [0, 7], clamp)} fill={C.gold} />
              </g>
            );
          })}
          {[...placesShown].map((key) => {
            const [x, y] = places[key];
            const l = labels[key];
            if (!l) return null;
            const first = shown.find(({e}) => (e.kind === 'king' ? kings[e.king].place === key : e.from === key));
            const o = interpolate(frame, [first!.start + 4, first!.start + 16], [0, 1], clamp);
            if (ORIGINS.has(key)) {
              return (
                <g key={key} opacity={o}>
                  <circle cx={x} cy={y} r={4} fill={C.blood} />
                  <text x={x + l.dx} y={y + l.dy} textAnchor={l.anchor} fontFamily={caps} fontSize={20} letterSpacing={2} fill={C.dim}>
                    {l.text.toUpperCase()}
                  </text>
                </g>
              );
            }
            return (
              <text key={key} x={x + l.dx} y={y + l.dy} textAnchor={l.anchor} fontFamily={caps} fontSize={20} letterSpacing={2} fill={C.gold} opacity={o}>
                {l.text.toUpperCase()}
              </text>
            );
          })}
        </svg>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(11,8,6,0) 1080px, rgba(11,8,6,0.94) 1210px, ${C.bg} 1320px)`}} />

        <div style={{position: 'absolute', left: 1250, top: 70, width: 600}}>
          <div style={{fontFamily: caps, fontWeight: 700, fontSize: 112, color: C.gold, letterSpacing: 4, lineHeight: 1}}>{year}</div>
          <div style={{height: 104, marginTop: 14}}>
            {frame >= MAP_INTRO ? (
              <div key={index} style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 38, lineHeight: 1.2, color: C.ink, opacity: interpolate(frame, [startOf(index) + 4, startOf(index) + 14], [0, 1], clamp)}}>
                {events[index].caption}
              </div>
            ) : null}
          </div>
          <div style={{marginTop: 26, borderTop: `1px solid ${C.goldFaint}`, paddingTop: 18}}>
            {kingRows.map(({e, start}) => {
              if (e.kind !== 'king') return null;
              const k = kings[e.king];
              const o = interpolate(frame, [start, start + 12], [0, 1], clamp);
              const x = interpolate(frame, [start, start + 12], [24, 0], {...clamp, easing: Easing.out(Easing.cubic)});
              return (
                <div key={k.id} style={{display: 'flex', alignItems: 'baseline', gap: 22, height: 62, opacity: o, transform: `translateX(${x}px)`}}>
                  <div style={{fontFamily: caps, fontWeight: 500, fontSize: 26, color: C.gold, width: 86}}>{k.year}</div>
                  <div style={{fontFamily: serif, fontWeight: 600, fontSize: 38, color: C.ink, whiteSpace: 'nowrap'}}>{k.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
};

// One card per ruler: slow push-in on the portrait, text rising in beside it.
export const KingCard: React.FC<{king: King; index: number}> = ({king, index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity = useSceneFade(10, 10);
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.09]);
  const rise = (delay: number) => spring({frame: frame - delay, fps, config: {damping: 200}});
  const rule = interpolate(frame, [16, 36], [0, 240], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <Backdrop>
      <AbsoluteFill style={{opacity}}>
        <div style={{position: 'absolute', left: 130, top: 110, width: 860, height: 860, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
          <Img src={staticFile(`portraits/${king.id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`}} />
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
        </div>
        <div style={{position: 'absolute', left: 116, top: 96, width: 888, height: 888, border: `1px solid ${C.goldFaint}`}} />
        <div style={{position: 'absolute', left: 1090, top: 0, width: 720, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontFamily: caps, fontWeight: 500, fontSize: 24, letterSpacing: 5, color: C.gold, opacity: rise(4), transform: `translateY(${(1 - rise(4)) * 16}px)`}}>
            {String(index + 1).padStart(2, '0')} · {king.realm.toUpperCase()}
          </div>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: king.name.length > 20 ? 78 : 96, lineHeight: 1.02, color: C.ink, marginTop: 18, opacity: rise(8), transform: `translateY(${(1 - rise(8)) * 26}px)`}}>
            {king.name}
          </div>
          <div style={{fontFamily: caps, fontWeight: 500, fontSize: 28, letterSpacing: 3, color: C.dim, marginTop: 16, opacity: rise(13)}}>{king.reign}</div>
          <div style={{width: rule, height: 2, background: C.gold, marginTop: 34, marginBottom: 34}} />
          <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 44, lineHeight: 1.32, color: C.ink, opacity: interpolate(frame, [22, 40], [0, 1], clamp)}}>
            {king.hook}
          </div>
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneFade(16, 20);
  const spread = interpolate(frame, [0, 90], [0.3, 0.14], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <Backdrop>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity}}>
        <div style={{fontFamily: caps, fontWeight: 700, fontSize: 118, color: C.gold, letterSpacing: `${spread}em`, textTransform: 'uppercase'}}>{TITLE}</div>
        <div style={{width: interpolate(frame, [10, 40], [0, 320], clamp), height: 2, background: C.gold, margin: '36px 0'}} />
        <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 50, color: C.ink, opacity: interpolate(frame, [24, 44], [0, 1], clamp)}}>{SUBTITLE}</div>
      </AbsoluteFill>
    </Backdrop>
  );
};

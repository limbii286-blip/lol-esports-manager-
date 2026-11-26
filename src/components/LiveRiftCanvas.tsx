import React, { useEffect, useRef } from 'react';
import { MEDIA_ASSETS } from '../assets/media';

interface LiveRiftCanvasProps {
  matchState: any;
  className?: string;
}

const BLUE_TURRETS: Record<string, [number, number][]> = {
  TOP: [
    [13, 34],
    [13, 55],
    [13, 73],
  ],
  MID: [
    [40, 60],
    [31, 69],
    [24, 76],
  ],
  BOT: [
    [66, 87],
    [46, 87],
    [28, 87],
  ],
};

const RED_TURRETS: Record<string, [number, number][]> = {
  TOP: [
    [34, 13],
    [54, 13],
    [72, 13],
  ],
  MID: [
    [60, 40],
    [69, 31],
    [76, 24],
  ],
  BOT: [
    [87, 66],
    [87, 45],
    [87, 27],
  ],
};

// Jungle camp coordinates (% of canvas)
const JUNGLE_CAMPS: { x: number; y: number; color: string }[] = [
  { x: 26, y: 46, color: '#38BDF8' }, // Blue side Blue buff
  { x: 52, y: 74, color: '#FB7185' }, // Blue side Red buff
  { x: 24, y: 63, color: '#94A3B8' }, // Blue Wolves
  { x: 46, y: 64, color: '#94A3B8' }, // Blue Raptors
  { x: 74, y: 54, color: '#38BDF8' }, // Red side Blue buff
  { x: 48, y: 26, color: '#FB7185' }, // Red side Red buff
  { x: 76, y: 37, color: '#94A3B8' }, // Red Wolves
  { x: 54, y: 36, color: '#94A3B8' }, // Red Raptors
];

// Waypoints from Blue Nexus -> Red Nexus for each lane
const LANE_PATHS: Record<'TOP' | 'MID' | 'BOT', [number, number][]> = {
  TOP: [
    [12, 86],
    [12, 55],
    [13, 18],
    [18, 13],
    [55, 12],
    [86, 12],
  ],
  MID: [
    [14, 86],
    [32, 68],
    [50, 50],
    [68, 32],
    [86, 14],
  ],
  BOT: [
    [14, 88],
    [48, 88],
    [82, 87],
    [87, 82],
    [88, 48],
    [88, 14],
  ],
};

function samplePolyline(pts: [number, number][], t: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const segCount = pts.length - 1;
  const scaled = clamped * segCount;
  const idx = Math.min(segCount - 1, Math.floor(scaled));
  const frac = scaled - idx;
  const [x1, y1] = pts[idx];
  const [x2, y2] = pts[idx + 1];
  return { x: x1 + (x2 - x1) * frac, y: y1 + (y2 - y1) * frac };
}

interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  speed: number;
  color: string;
  radius: number;
  isUlt?: boolean;
}

interface Shockwave {
  x: number;
  y: number;
  alpha: number;
  maxRadius: number;
  color: string;
}

interface FloatingCallout {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const LiveRiftCanvas: React.FC<LiveRiftCanvasProps> = ({ matchState, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const posMapRef = useRef<Record<string, { x: number; y: number; hp: number }>>({});
  const stateRef = useRef<any>(matchState);
  const projectilesRef = useRef<Projectile[]>([]);
  const wavesRef = useRef<Shockwave[]>([]);
  const calloutsRef = useRef<FloatingCallout[]>([]);
  const lastEventCountRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current = matchState;
    const events = matchState?.events || [];
    if (events.length > lastEventCountRef.current) {
      const newEvents = events.slice(lastEventCountRef.current);
      lastEventCountRef.current = events.length;

      newEvents.forEach((ev: any) => {
        const px = matchState?.lastEventPos?.x ?? 50;
        const py = matchState?.lastEventPos?.y ?? 50;
        const col = matchState?.lastEventPos?.color || '#E4BD67';
        const tag = String(ev.tag || '').toUpperCase();
        const text = String(ev.text || '').toUpperCase();

        const isBaron = tag.includes('BARON') || text.includes('BARON');
        const isDragon = tag.includes('EJDER') || text.includes('EJDER') || tag.includes('RUH');
        const isFight = tag.includes('SAVAŞ') || tag.includes('ACE') || tag.includes('SKOR') || tag.includes('KAN');
        const isTurret = tag.includes('KULE') || text.includes('KULE');

        wavesRef.current.push({
          x: px,
          y: py,
          alpha: 1,
          maxRadius: isBaron || isDragon ? 58 : isFight ? 46 : 34,
          color: isBaron ? '#A855F7' : isDragon ? '#F59E0B' : col,
        });

        // Burst of skillshots / ultimate bolts around event hotspot
        const burstCount = isBaron || isDragon || isFight ? 7 : 3;
        for (let i = 0; i < burstCount; i++) {
          const ang = (Math.PI * 2 * i) / burstCount + Math.random() * 0.5;
          const dist = 7 + Math.random() * 10;
          projectilesRef.current.push({
            x: px + Math.cos(ang) * dist,
            y: py + Math.sin(ang) * dist,
            tx: px + (Math.random() - 0.5) * 4,
            ty: py + (Math.random() - 0.5) * 4,
            progress: 0,
            speed: 0.055 + Math.random() * 0.04,
            color: i % 2 === 0 ? '#38BDF8' : '#FB7185',
            radius: i === 0 && (isBaron || isFight) ? 4.2 : 2.5,
            isUlt: i === 0 && (isBaron || isFight),
          });
        }

        // Broadcast floating callout
        let banner = '';
        let bColor = '#E4BD67';
        if (tag.includes('İLK KAN') || text.includes('İLK KAN')) {
          banner = 'FIRST BLOOD!';
          bColor = '#FB7185';
        } else if (isBaron) {
          banner = text.includes('ÇALDI') ? 'BARON STEAL!' : 'BARON SECURED!';
          bColor = '#C084FC';
        } else if (isDragon) {
          banner = text.includes('RUH') ? 'DRAGON SOUL!' : 'DRAGON!';
          bColor = '#FBBF24';
        } else if (tag.includes('ACE') || text.includes('ACE')) {
          banner = 'ACE!';
          bColor = '#E4BD67';
        } else if (isTurret) {
          banner = 'TURRET DOWN';
          bColor = '#38BDF8';
        } else if (isFight) {
          banner = 'CLASH!';
          bColor = '#F8FAFC';
        }
        if (banner) {
          calloutsRef.current.push({
            x: Math.max(18, Math.min(82, px)),
            y: Math.max(14, Math.min(86, py - 5)),
            text: banner,
            color: bColor,
            alpha: 1.0,
          });
        }
      });
    } else if (events.length < lastEventCountRef.current) {
      lastEventCountRef.current = events.length;
      projectilesRef.current = [];
      wavesRef.current = [];
      calloutsRef.current = [];
      posMapRef.current = {};
    }
  }, [matchState]);

  useEffect(() => {
    const img = new Image();
    img.src = MEDIA_ASSETS.tacticalMap;
    img.onload = () => {
      bgImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    const renderFrame = () => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const canvas = canvasRef.current;
      const st = stateRef.current;

      if (canvas && st) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const W = canvas.width;
          const H = canvas.height;
          ctx.clearRect(0, 0, W, H);

          // 1. Tactical Map Backdrop
          if (bgImgRef.current) {
            ctx.drawImage(bgImgRef.current, 0, 0, W, H);
            ctx.fillStyle = 'rgba(8, 12, 19, 0.28)';
            ctx.fillRect(0, 0, W, H);
          } else {
            ctx.fillStyle = '#0D131F';
            ctx.fillRect(0, 0, W, H);
          }

          // Subtle broadcast tactical grid
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 1;
          for (let g = 1; g < 4; g++) {
            ctx.beginPath();
            ctx.moveTo((W * g) / 4, 0);
            ctx.lineTo((W * g) / 4, H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, (H * g) / 4);
            ctx.lineTo(W, (H * g) / 4);
            ctx.stroke();
          }

          // 2. Jungle Camps (subtle glowing dots)
          JUNGLE_CAMPS.forEach((camp, idx) => {
            const pulse = 0.45 + 0.25 * Math.sin(tick * 0.04 + idx);
            ctx.beginPath();
            ctx.arc((camp.x / 100) * W, (camp.y / 100) * H, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = camp.color;
            ctx.globalAlpha = pulse;
            ctx.fill();
            ctx.globalAlpha = 1;
          });

          // 3. Animated Minion Waves on TOP, MID, BOT lanes (60 FPS marching & clashing)
          const wavePhase = (tick % 240) / 240; // 4-second wave loop
          (['TOP', 'MID', 'BOT'] as const).forEach((lane) => {
            const bRem = st.blueLaneTowers?.[lane] ?? 3;
            const rRem = st.redLaneTowers?.[lane] ?? 3;
            // Frontline shifts toward whichever side lost more towers
            const clashT = Math.max(0.22, Math.min(0.78, 0.5 + (bRem - rRem) * 0.09));
            const path = LANE_PATHS[lane];

            // Blue wave (3 minions marching toward clashT)
            for (let m = 0; m < 3; m++) {
              const tBlue = Math.min(clashT - 0.015 - m * 0.014, wavePhase * clashT * 1.15);
              if (tBlue > 0.02) {
                const pt = samplePolyline(path, tBlue);
                ctx.beginPath();
                ctx.arc((pt.x / 100) * W, (pt.y / 100) * H, 2.3, 0, Math.PI * 2);
                ctx.fillStyle = '#38BDF8';
                ctx.fill();
              }
              // Red wave (3 minions marching from 1 down to clashT)
              const tRed = Math.max(clashT + 0.015 + m * 0.014, 1 - wavePhase * (1 - clashT) * 1.15);
              if (tRed < 0.98) {
                const pt = samplePolyline(path, tRed);
                ctx.beginPath();
                ctx.arc((pt.x / 100) * W, (pt.y / 100) * H, 2.3, 0, Math.PI * 2);
                ctx.fillStyle = '#FB7185';
                ctx.fill();
              }
            }

            // Minion clash sparks at frontline
            if (tick % 18 < 9) {
              const clashPt = samplePolyline(path, clashT);
              ctx.beginPath();
              ctx.arc((clashPt.x / 100) * W, (clashPt.y / 100) * H, 3.8, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
              ctx.fill();
            }
          });

          // 4. Baron & Dragon Objective Pits + Contested HP Bar
          const drawPit = (px: number, py: number, label: string, timer: number, color: string) => {
            const x = (px / 100) * W;
            const y = (py / 100) * H;
            const alive = st.minute >= timer;
            const aura = alive ? 16 + Math.sin(tick * 0.07) * 2.2 : 14;

            if (alive) {
              ctx.beginPath();
              ctx.arc(x, y, aura + 4, 0, Math.PI * 2);
              ctx.fillStyle = `${color}18`;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fillStyle = alive ? `${color}33` : 'rgba(15, 23, 42, 0.72)';
            ctx.fill();
            ctx.strokeStyle = alive ? color : 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = alive ? 1.8 : 1;
            ctx.stroke();

            ctx.font = '700 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = alive ? '#F8FAFC' : '#94A3B8';
            ctx.fillText(alive ? label : `${Math.max(0, timer - st.minute)}d`, x, y + 3);

            // Show objective HP bar if champions are contesting the pit
            if (alive) {
              const nearby = [...(st.bluePlayers || []), ...(st.redPlayers || [])].filter(
                (p: any) => Math.hypot((p.x ?? 50) - px, (p.y ?? 50) - py) < 16
              );
              if (nearby.length >= 2) {
                const barW = 30;
                const hpPct = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(tick * 0.06));
                ctx.fillStyle = 'rgba(11, 14, 20, 0.85)';
                ctx.fillRect(x - barW / 2, y - 23, barW, 4);
                ctx.fillStyle = color;
                ctx.fillRect(x - barW / 2, y - 23, barW * hpPct, 4);
              }
            }
          };

          drawPit(31, 31, 'BRN', st.baronTimer ?? 20, '#A855F7');
          drawPit(69, 69, st.soulSide ? 'ELD' : 'DRG', st.soulSide ? st.elderTimer ?? 35 : st.dragonTimer ?? 5, '#F59E0B');

          // 5. Lane Turrets + Active Turret Laser Shots
          const allPlayers = [...(st.bluePlayers || []), ...(st.redPlayers || [])];
          const drawTurrets = (
            turretMap: Record<string, [number, number][]>,
            counts: Record<string, number>,
            aliveColor: string,
            enemySide: 'blue' | 'red'
          ) => {
            (['TOP', 'MID', 'BOT'] as const).forEach((lane) => {
              const rem = counts?.[lane] ?? 3;
              const coords = turretMap[lane];
              coords.forEach(([tx, ty], idx) => {
                const isAlive = idx >= 3 - rem;
                const x = (tx / 100) * W;
                const y = (ty / 100) * H;
                ctx.beginPath();
                ctx.arc(x, y, isAlive ? 5.2 : 3.2, 0, Math.PI * 2);
                ctx.fillStyle = isAlive ? aliveColor : 'rgba(30, 41, 59, 0.55)';
                ctx.fill();
                ctx.strokeStyle = isAlive ? '#0B0E14' : 'rgba(148, 163, 184, 0.25)';
                ctx.lineWidth = 1.4;
                ctx.stroke();

                // Turret laser beam when an enemy champion dives within range
                if (isAlive && tick % 24 < 10) {
                  const target = allPlayers.find(
                    (p: any) => p.side === enemySide && Math.hypot((p.x ?? 50) - tx, (p.y ?? 50) - ty) < 12
                  );
                  if (target) {
                    const key = `${target.side}_${target.role}`;
                    const tp = posMapRef.current[key];
                    if (tp) {
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                      ctx.lineTo(tp.x, tp.y);
                      ctx.strokeStyle = aliveColor;
                      ctx.globalAlpha = 0.7;
                      ctx.lineWidth = 1.6;
                      ctx.stroke();
                      ctx.globalAlpha = 1;
                    }
                  }
                }
              });
            });
          };

          drawTurrets(BLUE_TURRETS, st.blueLaneTowers, '#38BDF8', 'red');
          drawTurrets(RED_TURRETS, st.redLaneTowers, '#FB7185', 'blue');

          // 6. Blue & Red Nexus Rings
          const drawNexus = (nx: number, ny: number, hp: number, color: string, tag: string) => {
            const x = (nx / 100) * W;
            const y = (ny / 100) * H;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(11, 14, 20, 0.88)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + (Math.max(0, hp) / 100) * Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = '700 9px "Barlow Condensed", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(tag.slice(0, 3), x, y + 3.5);
          };

          drawNexus(10, 90, st.blueNexusHP ?? 100, '#38BDF8', st.blueTeam?.tag || 'BLU');
          drawNexus(90, 10, st.redNexusHP ?? 100, '#FB7185', st.redTeam?.tag || 'RED');

          // 7. Ambient Champion-vs-Champion Skirmish Skillshots when opposing champions are close
          if (tick % 20 === 0) {
            const blues = st.bluePlayers || [];
            const reds = st.redPlayers || [];
            for (const bp of blues) {
              for (const rp of reds) {
                const dist = Math.hypot((bp.x ?? 50) - (rp.x ?? 50), (bp.y ?? 50) - (rp.y ?? 50));
                if (dist < 14 && projectilesRef.current.length < 28) {
                  projectilesRef.current.push({
                    x: bp.x ?? 50,
                    y: bp.y ?? 50,
                    tx: rp.x ?? 50,
                    ty: rp.y ?? 50,
                    progress: 0,
                    speed: 0.08,
                    color: bp.champColor || '#38BDF8',
                    radius: 2.4,
                  });
                  projectilesRef.current.push({
                    x: rp.x ?? 50,
                    y: rp.y ?? 50,
                    tx: bp.x ?? 50,
                    ty: bp.y ?? 50,
                    progress: 0,
                    speed: 0.08,
                    color: rp.champColor || '#FB7185',
                    radius: 2.4,
                  });
                }
              }
            }
          }

          // 8. Render Active Shockwave Ripples (Teamfights / Ultimates / Objectives)
          wavesRef.current = wavesRef.current.filter((w) => w.alpha > 0.03);
          wavesRef.current.forEach((w) => {
            const px = (w.x / 100) * W;
            const py = (w.y / 100) * H;
            const radius = 10 + (1 - w.alpha) * w.maxRadius;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.strokeStyle = w.color;
            ctx.globalAlpha = w.alpha;
            ctx.lineWidth = 2.4;
            ctx.stroke();
            ctx.globalAlpha = 1;
            w.alpha *= 0.935;
          });

          // 9. Render Skillshots & Ultimate Projectiles
          projectilesRef.current = projectilesRef.current.filter((pr) => pr.progress < 1);
          projectilesRef.current.forEach((pr) => {
            pr.progress += pr.speed;
            const curX = ((pr.x + (pr.tx - pr.x) * pr.progress) / 100) * W;
            const curY = ((pr.y + (pr.ty - pr.y) * pr.progress) / 100) * H;
            const prevT = Math.max(0, pr.progress - 0.16);
            const tailX = ((pr.x + (pr.tx - pr.x) * prevT) / 100) * W;
            const tailY = ((pr.y + (pr.ty - pr.y) * prevT) / 100) * H;

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(curX, curY);
            ctx.strokeStyle = pr.color;
            ctx.globalAlpha = 0.85;
            ctx.lineWidth = pr.isUlt ? 3 : 1.7;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(curX, curY, pr.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1;
          });

          // 10. Smoothly Interpolated 10 Champion Tokens with Live HP Bars
          allPlayers.forEach((p: any, idx: number) => {
            const key = `${p.side}_${p.role}`;
            const targetX = ((p.x ?? 50) / 100) * W;
            const targetY = ((p.y ?? 50) / 100) * H;

            // Check if champion is currently skirmishing near an enemy to animate dynamic HP bar
            const inCombat = allPlayers.some(
              (o: any) => o.side !== p.side && Math.hypot((o.x ?? 50) - (p.x ?? 50), (o.y ?? 50) - (p.y ?? 50)) < 14
            );
            const targetHp = inCombat ? 0.48 + 0.36 * (0.5 + 0.5 * Math.sin(tick * 0.12 + idx * 1.7)) : 1.0;

            if (!posMapRef.current[key]) {
              posMapRef.current[key] = { x: targetX, y: targetY, hp: 1.0 };
            } else {
              posMapRef.current[key].x += (targetX - posMapRef.current[key].x) * 0.13;
              posMapRef.current[key].y += (targetY - posMapRef.current[key].y) * 0.13;
              posMapRef.current[key].hp += (targetHp - posMapRef.current[key].hp) * 0.1;
            }

            const cx = posMapRef.current[key].x;
            const cy = posMapRef.current[key].y;
            const hpPct = posMapRef.current[key].hp;
            const isBlue = p.side === 'blue';
            const ringColor = isBlue ? '#38BDF8' : '#FB7185';

            // Vision aura
            ctx.beginPath();
            ctx.arc(cx, cy, 19, 0, Math.PI * 2);
            ctx.fillStyle = isBlue ? 'rgba(56, 189, 248, 0.08)' : 'rgba(251, 113, 133, 0.08)';
            ctx.fill();

            // Live HP Bar above token
            const barW = 24;
            const barH = 3.5;
            ctx.fillStyle = 'rgba(11, 14, 20, 0.88)';
            ctx.fillRect(cx - barW / 2, cy - 16, barW, barH);
            ctx.fillStyle = hpPct > 0.5 ? (isBlue ? '#38BDF8' : '#FB7185') : '#F59E0B';
            ctx.fillRect(cx - barW / 2, cy - 16, barW * Math.max(0.12, hpPct), barH);

            // Champion disc
            ctx.beginPath();
            ctx.arc(cx, cy, 10.5, 0, Math.PI * 2);
            ctx.fillStyle = '#0F172A';
            ctx.fill();
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2.1;
            ctx.stroke();

            // Champion inner accent
            ctx.beginPath();
            ctx.arc(cx, cy, 7.2, 0, Math.PI * 2);
            ctx.fillStyle = p.champColor || ringColor;
            ctx.globalAlpha = 0.88;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Role initial
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(p.role.slice(0, 1), cx, cy + 3);

            // Player name micro-label
            ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
            const label = p.name.slice(0, 8);
            const tw = ctx.measureText(label).width + 6;
            ctx.fillStyle = 'rgba(11, 14, 20, 0.82)';
            ctx.fillRect(cx - tw / 2, cy + 12, tw, 11.5);
            ctx.fillStyle = isBlue ? '#BAE6FD' : '#FECDD3';
            ctx.fillText(label, cx, cy + 20.5);
          });

          // 11. Broadcast Floating Event Callouts
          calloutsRef.current = calloutsRef.current.filter((c) => c.alpha > 0.04);
          calloutsRef.current.forEach((c) => {
            const x = (c.x / 100) * W;
            const y = (c.y / 100) * H;
            ctx.globalAlpha = Math.min(1, c.alpha);
            ctx.font = '800 11px "Barlow Condensed", sans-serif';
            ctx.textAlign = 'center';
            const tw = ctx.measureText(c.text).width + 12;
            ctx.fillStyle = 'rgba(11, 14, 20, 0.88)';
            ctx.fillRect(x - tw / 2, y - 10, tw, 16);
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - tw / 2, y - 10, tw, 16);
            ctx.fillStyle = c.color;
            ctx.fillText(c.text, x, y + 2);
            ctx.globalAlpha = 1;
            c.y -= 0.09;
            c.alpha -= 0.011;
          });
        }
      }
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-white/[0.1] bg-[#0B0E14] ${className}`}>
      <canvas ref={canvasRef} width={460} height={460} className="w-full h-auto block aspect-square" />
      <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded bg-[#0B0E14]/80 border border-white/[0.1] text-[10px] font-mono-num text-slate-300 pointer-events-none">
        CANLI 2D · 60 FPS
      </div>
    </div>
  );
};

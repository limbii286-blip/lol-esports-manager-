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

export const LiveRiftCanvas: React.FC<LiveRiftCanvasProps> = ({ matchState, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const posMapRef = useRef<Record<string, { x: number; y: number }>>({});
  const stateRef = useRef<any>(matchState);
  const pulseRef = useRef<{ x: number; y: number; alpha: number; color: string } | null>(null);
  const lastMinRef = useRef<number>(-1);

  useEffect(() => {
    stateRef.current = matchState;
    if (matchState?.lastEventPos && matchState.minute !== lastMinRef.current) {
      lastMinRef.current = matchState.minute;
      pulseRef.current = {
        x: matchState.lastEventPos.x,
        y: matchState.lastEventPos.y,
        alpha: 1,
        color: matchState.lastEventPos.color || '#E4BD67',
      };
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
            ctx.fillStyle = 'rgba(11, 14, 20, 0.24)';
            ctx.fillRect(0, 0, W, H);
          } else {
            ctx.fillStyle = '#0F1520';
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(W * 0.1, H * 0.9);
            ctx.lineTo(W * 0.9, H * 0.1);
            ctx.stroke();
          }

          // Subtle coordinate grid
          ctx.strokeStyle = 'rgba(255,255,255,0.035)';
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

          // 2. Baron & Dragon Objective Pits
          const drawPit = (px: number, py: number, label: string, timer: number, color: string) => {
            const x = (px / 100) * W;
            const y = (py / 100) * H;
            const alive = st.minute >= timer;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fillStyle = alive ? `${color}30` : 'rgba(15, 23, 42, 0.65)';
            ctx.fill();
            ctx.strokeStyle = alive ? color : 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = alive ? 1.8 : 1;
            ctx.stroke();

            ctx.font = '700 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = alive ? '#F8FAFC' : '#94A3B8';
            ctx.fillText(alive ? label : `${Math.max(0, timer - st.minute)}d`, x, y + 3);
          };

          drawPit(31, 31, 'BRN', st.baronTimer ?? 20, '#A855F7');
          drawPit(69, 69, st.soulSide ? 'ELD' : 'DRG', st.soulSide ? st.elderTimer ?? 35 : st.dragonTimer ?? 5, '#F59E0B');

          // 3. Lane Turrets (remaining count)
          const drawTurrets = (
            turretMap: Record<string, [number, number][]>,
            counts: Record<string, number>,
            aliveColor: string
          ) => {
            (['TOP', 'MID', 'BOT'] as const).forEach((lane) => {
              const rem = counts?.[lane] ?? 3;
              const coords = turretMap[lane];
              // Outer turret falls first (idx 0), then inner (1), then inhib turret (2)
              coords.forEach(([tx, ty], idx) => {
                const isAlive = idx >= 3 - rem;
                const x = (tx / 100) * W;
                const y = (ty / 100) * H;
                ctx.beginPath();
                ctx.arc(x, y, isAlive ? 5 : 3.5, 0, Math.PI * 2);
                ctx.fillStyle = isAlive ? aliveColor : 'rgba(30, 41, 59, 0.55)';
                ctx.fill();
                ctx.strokeStyle = isAlive ? '#0B0E14' : 'rgba(148, 163, 184, 0.25)';
                ctx.lineWidth = 1.4;
                ctx.stroke();
              });
            });
          };

          drawTurrets(BLUE_TURRETS, st.blueLaneTowers, '#38BDF8');
          drawTurrets(RED_TURRETS, st.redLaneTowers, '#FB7185');

          // 4. Blue & Red Nexus Rings
          const drawNexus = (nx: number, ny: number, hp: number, color: string, tag: string) => {
            const x = (nx / 100) * W;
            const y = (ny / 100) * H;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(11, 14, 20, 0.85)';
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

          // 5. Combat Clash Shockwave Ripple
          if (pulseRef.current && pulseRef.current.alpha > 0.02) {
            const p = pulseRef.current;
            const px = (p.x / 100) * W;
            const py = (p.y / 100) * H;
            const radius = 12 + (1 - p.alpha) * 44;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.lineWidth = 2.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
            p.alpha *= 0.94;
          }

          // 6. Smoothly Interpolated 10 Champion Tokens
          const allPlayers = [...(st.bluePlayers || []), ...(st.redPlayers || [])];
          allPlayers.forEach((p: any) => {
            const key = `${p.side}_${p.role}`;
            const targetX = ((p.x ?? 50) / 100) * W;
            const targetY = ((p.y ?? 50) / 100) * H;
            if (!posMapRef.current[key]) {
              posMapRef.current[key] = { x: targetX, y: targetY };
            } else {
              posMapRef.current[key].x += (targetX - posMapRef.current[key].x) * 0.14;
              posMapRef.current[key].y += (targetY - posMapRef.current[key].y) * 0.14;
            }

            const cx = posMapRef.current[key].x;
            const cy = posMapRef.current[key].y;
            const isBlue = p.side === 'blue';
            const ringColor = isBlue ? '#38BDF8' : '#FB7185';

            // Subtle vision aura
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fillStyle = isBlue ? 'rgba(56, 189, 248, 0.08)' : 'rgba(251, 113, 133, 0.08)';
            ctx.fill();

            // Champion disc
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#0F172A';
            ctx.fill();
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Champion inner accent dot
            ctx.beginPath();
            ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
            ctx.fillStyle = p.champColor || ringColor;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Role initials inside token
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(p.role.slice(0, 1), cx, cy + 3);

            // Player name micro-label below token
            ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = 'rgba(11, 14, 20, 0.78)';
            const label = p.name.slice(0, 8);
            const tw = ctx.measureText(label).width + 6;
            ctx.fillRect(cx - tw / 2, cy + 13, tw, 12);
            ctx.fillStyle = isBlue ? '#BAE6FD' : '#FECDD3';
            ctx.fillText(label, cx, cy + 22);
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
      <canvas ref={canvasRef} width={440} height={440} className="w-full h-auto block aspect-square" />
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import s from './games.module.css';

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Roue de la fortune. Le segment i est centré à i × (360 / n) degrés depuis le haut.
 * À chaque nouveau `spinId`, la roue fait plusieurs tours et s'arrête sur `targetIndex`,
 * puis appelle onDone(). Le résultat vient du serveur : la roue ne fait que l'afficher.
 */
export function Wheel({ segments, spinId, targetIndex, onDone, spinning }) {
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const rotationRef = useRef(0);
  const n = segments.length;
  const step = 360 / n;

  useEffect(() => {
    if (!spinId || targetIndex === null || targetIndex === undefined) return;
    const fast = reduceMotion();
    const current = rotationRef.current;
    const desired = (360 - targetIndex * step) % 360;
    const jitter = (Math.random() - 0.5) * step * 0.6;
    const delta = ((desired - (current % 360)) + 360) % 360;
    const next = current + (fast ? 360 : 360 * 6) + delta + jitter;
    rotationRef.current = next;
    setDuration(fast ? 300 : 4800);
    setRotation(next);
  }, [spinId]); // eslint-disable-line react-hooks/exhaustive-deps

  const gradient = `conic-gradient(from ${-step / 2}deg, ${segments.map((sg, i) => `${sg.color} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
  const bulbs = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * 2 * Math.PI;
    return { left: `${50 + 46.5 * Math.sin(a)}%`, top: `${50 - 46.5 * Math.cos(a)}%` };
  });

  return (
    <div className={s.wheelWrap} role="img" aria-label={`Roue : ${segments.map((sg) => `${sg.multiplier}x`).join(', ')}`}>
      <div className={s.rim} />
      {bulbs.map((b, i) => <span key={i} className={`${s.bulb} ${spinning && i % 2 ? s.bulbOn : ''}`} style={b} />)}
      <div className={s.pointer} />
      <div
        className={s.disc}
        style={{ background: gradient, transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}
        onTransitionEnd={() => onDone?.()}
      >
        {segments.map((sg, i) => (
          <span key={i} className={s.label} style={{ transform: `translate(-50%, -50%) rotate(${i * step}deg) translateY(-34cqw)` }}>
            {sg.multiplier}x
          </span>
        ))}
      </div>
      <div className={s.hub} />
    </div>
  );
}

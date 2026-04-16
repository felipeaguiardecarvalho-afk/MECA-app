import React, { useEffect, useState } from 'react';
import { ArchetypeResult } from '../../utils/archetypeEngine';

interface Props { archetype: ArchetypeResult; }

const QUADRANTS = [
  { id: 'top-left',     label: 'Potencial\nDisperso',        bgColor: '#e8ecf0', textColor: '#1a3a5c', gridArea: '1 / 1 / 2 / 2' },
  { id: 'top-right',    label: 'Performance\nAlavancada',     bgColor: '#dbeeff', textColor: '#1a3a5c', gridArea: '1 / 2 / 2 / 3' },
  { id: 'bottom-left',  label: 'Risco\nEstrutural',           bgColor: '#5a6a7a', textColor: '#ffffff', gridArea: '2 / 1 / 3 / 2' },
  { id: 'bottom-right', label: 'Executor\nSobrecarregado',    bgColor: '#f7f7f7', textColor: '#1a3a5c', gridArea: '2 / 2 / 3 / 3' },
];

export const ArchetypeMatrix: React.FC<Props> = ({ archetype }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const dotX = `${archetype.xScore}%`;
  const dotY = `${100 - archetype.yScore}%`;

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5c', marginBottom: 4 }}>Arquétipo MECA</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Seu perfil na matriz de aceleração</p>

      <div style={{ position: 'relative', paddingTop: 28, paddingBottom: 28, paddingLeft: 80, paddingRight: 16 }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>↑ Alta Capacidade</div>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>↓ Baixa Capacidade</div>
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', width: 80, textAlign: 'center' }}>Baixa Direção e Sistema</div>
        <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', width: 80, textAlign: 'center' }}>Alta Direção e Sistema</div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', aspectRatio: '1 / 1', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.5, background: '#9ca3af', zIndex: 1, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: '#9ca3af', zIndex: 1, transform: 'translateY(-50%)' }} />

          {QUADRANTS.map((q) => (
            <div key={q.id} style={{ gridArea: q.gridArea, background: q.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, opacity: archetype.quadrant === q.id ? 1 : 0.65, transition: 'opacity 0.5s ease' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: q.textColor, textAlign: 'center', lineHeight: 1.3 }}>
                {q.label.split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                ))}
              </span>
            </div>
          ))}

          <div style={{ position: 'absolute', left: dotX, top: dotY, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', background: 'rgba(26,58,92,0.15)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'mecaPulse 2s infinite' }} />
            <div title={`${archetype.name} | Capacidade: ${Math.round(archetype.yScore)} | Direção: ${Math.round(archetype.xScore)}`}
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#1a3a5c', border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(26,58,92,0.4)', cursor: 'pointer', transform: animated ? 'scale(1)' : 'scale(0)', transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative', zIndex: 2 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Capacidade Individual</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a3a5c' }}>{Math.round(archetype.yScore)}<span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>/100</span></div>
        </div>
        <div style={{ width: 1, background: '#e5e7eb' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Direção e Sistema</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a3a5c' }}>{Math.round(archetype.xScore)}<span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>/100</span></div>
        </div>
      </div>

      <style>{`@keyframes mecaPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6} 50%{transform:translate(-50%,-50%) scale(1.6);opacity:0} }`}</style>
    </div>
  );
};

export default ArchetypeMatrix;

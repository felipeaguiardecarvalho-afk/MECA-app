import React from 'react';
import { ArchetypeResult, PILAR_COLORS, MECAScores } from '../../utils/archetypeEngine';

interface Props { archetype: ArchetypeResult; scores: MECAScores; onActionPlan?: () => void; }

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="7" cy="7" r="7" fill="#1a3a5c" />
    <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS: Record<string, string> = {
  'Potencial Disperso': '◈', 'Performance Alavancada': '◆',
  'Risco Estrutural': '▲', 'Executor Sobrecarregado': '◉',
};

export const ArchetypeCard: React.FC<Props> = ({ archetype, scores, onActionPlan }) => {
  const weakColor = PILAR_COLORS[archetype.weakestPilar];
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(26,58,92,0.07)', overflow: 'hidden' }}>
      <div style={{ background: archetype.bgColor, padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          <span style={{ color: '#fff' }}>{ICONS[archetype.name] || '◆'}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Você é:</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: archetype.textColor === '#ffffff' ? '#1a3a5c' : archetype.textColor, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
            {archetype.name}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, marginBottom: 18 }}>{archetype.description}</p>

        <div style={{ background: '#f8fafc', borderLeft: '3px solid #1a3a5c', borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Seu desafio agora</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a5c' }}>{archetype.challenge}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '8px 12px', background: `${weakColor}15`, borderRadius: 8, border: `1px solid ${weakColor}30` }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: weakColor, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {archetype.weakestPilar}
          </div>
          <span style={{ fontSize: 13, color: '#374151' }}>
            <strong>Ponto de atenção:</strong> {archetype.weakestPilarName} <span style={{ color: weakColor, fontWeight: 700 }}>({scores[archetype.weakestPilar]}/100)</span>
          </span>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Próximos passos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {archetype.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.55 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={onActionPlan}
          style={{ width: '100%', padding: '13px 20px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.2px' }}>
          Ver Plano de Ação <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
};

export default ArchetypeCard;

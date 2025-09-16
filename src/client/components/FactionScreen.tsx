import type { Faction } from '../types';

type Props = {
  factions: Faction[];
  onFactionSelect: (factionId: string) => void;
};

export function FactionScreen({ factions, onFactionSelect }: Props) {
  return (
    <div className="start-screen" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <img src="/karma-kart-clear.png" style={{width: '4rem'}} />
      <h1 className="racing-title" style={{ fontSize: '2.5rem', marginBottom: '1rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
        Choose Your Faction
      </h1>
      <p className="racing-subtitle" style={{ fontSize: '1rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.7)', textAlign: 'center' }}>
        Your karma will be added to your faction's total!
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        width: '100%', 
        maxWidth: '800px',
        marginBottom: '2rem'
      }}>
        {factions.map((faction) => (
          <button
            key={faction.id}
            onClick={() => onFactionSelect(faction.id)}
            className="racing-text"
            style={{
              padding: '1.5rem',
              background: `linear-gradient(135deg, ${faction.color}22, ${faction.color}44)`,
              border: `2px solid ${faction.color}`,
              borderRadius: '15px',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
              e.currentTarget.style.background = `linear-gradient(135deg, ${faction.color}33, ${faction.color}66)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              e.currentTarget.style.background = `linear-gradient(135deg, ${faction.color}22, ${faction.color}44)`;
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              <img src={faction.emoji} alt={faction.name} style={{ width: '48px', height: '48px' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{faction.name}</div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>{faction.description}</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: faction.color }}>
              Total Karma: {faction.totalKarma}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import type { GameResult, Faction } from '../types';

type Props = {
  gameResult: GameResult;
  selectedFaction: string | null;
  factions: Faction[];
  onBackToMenu: () => void;
};

export function EndScreen({ gameResult, selectedFaction, factions, onBackToMenu }: Props) {
  const selectedFactionData = selectedFaction ? factions.find(f => f.id === selectedFaction) : null;
  const karma = gameResult.up - gameResult.down;
  
  return (
    <div className="end-screen" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 className="racing-title" style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
        Race Complete!
      </h1>
      
      {selectedFactionData && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem 2rem', 
          background: `linear-gradient(135deg, ${selectedFactionData.color}22, ${selectedFactionData.color}44)`,
          border: `2px solid ${selectedFactionData.color}`,
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <img src={selectedFactionData.emoji} alt={selectedFactionData.name} style={{ width: '32px', height: '32px' }} />
            <span style={{ color: selectedFactionData.color, fontWeight: 'bold' }}>{selectedFactionData.name}</span>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'white' }}>
            +{karma} Karma contributed to your faction!
          </div>
        </div>
      )}
      
      <div className="racing-text" style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '3rem', lineHeight: '1.6', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>↑ Upvotes: {gameResult.up}</span>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ color: '#E53935', fontWeight: 'bold' }}>↓ Downvotes: {gameResult.down}</span>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontWeight: 'bold', color: karma >= 0 ? '#4CAF50' : '#E53935' }}>
            ⚡ Karma: {karma}
          </span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Distance: {gameResult.distance.toFixed(0)}m</span>
        </div>
      </div>
      
      <button
        className="racing-subtitle"
        onClick={onBackToMenu}
        style={{
          fontSize: '1.6rem',
          padding: '1rem 2rem',
          background: '#ff5700',
          border: 'none',
          borderRadius: '50px',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontWeight: 700,
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        }}
      >
        Main Menu
      </button>
    </div>
  );
}

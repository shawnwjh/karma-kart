import { useState, useEffect } from 'react';

type Props = {
  onStartRace: () => void;
  onBackToMenu: () => void;
};

export function RulesScreen({ onStartRace, onBackToMenu }: Props) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Handle mobile detection with window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="start-screen" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <img src="/karma-kart-clear.png" style={{width: isMobile ? '3rem' : '4rem'}} />
      <h1 className="racing-title" style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '0.5rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
        How to Race
      </h1>
      
      <div className="racing-text" style={{ 
        fontSize: isMobile ? '1rem' : '1.3rem', 
        maxWidth: isMobile ? '350px' : '600px', 
        textAlign: 'center', 
        marginBottom: '0.5rem', 
        lineHeight: '1.8',
        textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
      }}>
        <div style={{ marginBottom: isMobile ? '0.3rem' : '0.5rem' }}>
          <strong>🎯 Objective:</strong> Collect upvotes and downvotes around the track!
        </div>
        
        <div style={{ marginBottom: isMobile ? '0.3rem' : '0.5rem' }}>
          <strong>🏎️ Controls:</strong> Arrow keys or A/D to steer • Touch left/right side of screen on mobile
        </div>
        
        <div style={{ marginBottom: isMobile ? '0.3rem' : '0.5rem' }}>
          🏁 Cross the finish line to respawn all pickups
        </div>
        
        <div style={{ marginBottom: isMobile ? '0.3rem' : '0.5rem' }}>
          ⏱️ You have 30 seconds to collect as many upvotes as possible!
        </div>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="racing-subtitle"
          onClick={onBackToMenu}
          style={{
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            padding: isMobile ? '0.6rem 1.5rem' : '0.8rem 2rem',
            background: '#666',
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
          Back to Menu
        </button>
        
        <button
          className="racing-subtitle"
          onClick={onStartRace}
          style={{
            fontSize: isMobile ? '1.4rem' : '2rem',
            padding: isMobile ? '0.75rem 2rem' : '1rem 3rem',
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
          Lets go!
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { generateTrack } from '../shared/track/generateTrack';
import { RaceCanvas, FactionScreen, RulesScreen, EndScreen } from './components';
import { TRACK } from './constants';
import type { InitResponse } from '../shared/types/api';
import type { GameScreen, GameResult, Faction } from './types';

export default function App() {
  // State management
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameScreen, setGameScreen] = useState<GameScreen>('start');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [userContribution, setUserContribution] = useState<number>(0);
  const [factions, setFactions] = useState<Faction[]>([
    { id: 'red', name: 'Red Team', color: '#ff4444', emoji: '/karma-kart-red.png', description: 'Team Red', totalKarma: 0 },
    { id: 'blue', name: 'Blue Team', color: '#4444ff', emoji: '/karma-kart-blue.png', description: 'Team Blue', totalKarma: 0 },
    { id: 'green', name: 'Green Team', color: '#44ff44', emoji: '/karma-kart-green.png', description: 'Team Green', totalKarma: 0 },
    { id: 'yellow', name: 'Yellow Team', color: '#ffff44', emoji: '/karma-kart-yellow.png', description: 'Team Yellow', totalKarma: 0 }
  ]);

  // Game track
  const track = generateTrack('karma-kart-dev', {
    baseWidth: TRACK.BASE_WIDTH,
    widthAmp: TRACK.WIDTH_AMP,
    radius: TRACK.RADIUS,
    spacing: TRACK.SPACING
  });

  // Initialize user data and preload assets
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/init');
        const data: InitResponse = await response.json();
        setUsername(data.username);
        
        if (data.userFaction) {
          setSelectedFaction(data.userFaction);
        }
        
        if (data.userContribution !== undefined) {
          setUserContribution(data.userContribution);
        }
        
        if (data.factionScores) {
          setFactions(prevFactions => 
            prevFactions.map(faction => ({
              ...faction,
              totalKarma: data.factionScores![faction.id] || 0
            }))
          );
        }
        
        // Handle avatar loading
        const cachedAvatarKey = `avatar_${data.username}`;
        const cachedAvatar = localStorage.getItem(cachedAvatarKey);
        
        if (cachedAvatar) {
          setAvatarUrl(cachedAvatar);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = cachedAvatar;
        }
        
        if (data.username && data.username !== 'anonymous') {
          try {
            const avatarResponse = await fetch(`/api/avatar/${data.username}`);
            if (avatarResponse.ok) {
              const avatarData = await avatarResponse.json();
              if (avatarData.avatarUrl && avatarData.avatarUrl !== cachedAvatar) {
                setAvatarUrl(avatarData.avatarUrl);
                localStorage.setItem(cachedAvatarKey, avatarData.avatarUrl);
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = avatarData.avatarUrl;
              }
            }
          } catch (error) {
            console.warn('Failed to preload avatar:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUsername('anonymous');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Preload team logo images
  useEffect(() => {
    const teamLogos = ['/karma-kart-red.png', '/karma-kart-blue.png', '/karma-kart-green.png', '/karma-kart-yellow.png'];
    teamLogos.forEach(logoSrc => {
      const img = new Image();
      img.src = logoSrc;
    });
  }, []);

  // Event handlers
  const handleStartGame = () => {
    const validFactionIds = factions.map(f => f.id);
    const hasValidFaction = selectedFaction && validFactionIds.includes(selectedFaction);
    
    setGameScreen(hasValidFaction ? 'rules' : 'factions');
    setGameResult(null);
  };

  const handleFactionSelect = async (factionId: string) => {
    try {
      const response = await fetch('/api/faction/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factionId })
      });
      
      if (response.ok) {
        setSelectedFaction(factionId);
        setGameScreen('rules');
      }
    } catch (error) {
      console.error('Failed to save faction choice:', error);
    }
  };

  const handleStartRace = () => {
    setGameScreen('playing');
    setGameResult(null);
  };

  const handleEndGame = async (result: GameResult) => {
    const karma = result.up - result.down;
    
    setGameResult(result);
    setGameScreen('end');
    
    if (selectedFaction) {
      // Optimistically update local state
      setFactions(prevFactions => 
        prevFactions.map(faction => 
          faction.id === selectedFaction 
            ? { ...faction, totalKarma: faction.totalKarma + karma }
            : faction
        )
      );
      
      setUserContribution(prev => prev + karma);
      
      // Send to server (non-blocking)
      fetch('/api/karma/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factionId: selectedFaction, karma })
      }).catch(error => {
        console.error('Failed to add karma to faction:', error);
      });
    }
  };

  const handleBackToMenu = () => {
    setGameScreen('start');
    setGameResult(null);
  };

  // Render loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2 className="racing-title" style={{ fontSize: '2rem', marginBottom: '1rem', textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
          Karma Kart
        </h2>
      </div>
    );
  }

  // Faction validation
  const validFactionIds = factions.map(f => f.id);
  const isValidFaction = selectedFaction && validFactionIds.includes(selectedFaction);
  const userFactionData = isValidFaction ? factions.find(f => f.id === selectedFaction) : null;

  // Render main menu
  if (gameScreen === 'start') {
    return (
      <div className="start-screen" style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white' // Ensure text is visible
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <h1 className="racing-title" style={{ fontSize: '1rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
            Karma Kart
          </h1>
        </div>
        
        <div style={{
          padding: '1.5rem',
          width: '100%',
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '0.75rem'
          }}>
            {factions
              .sort((a, b) => b.totalKarma - a.totalKarma)
              .map((faction, index) => (
                <div
                  key={faction.id}
                  style={{
                    padding: '0.75rem',
                    background: selectedFaction === faction.id 
                      ? `linear-gradient(135deg, ${faction.color}33, ${faction.color}55)`
                      : 'rgba(0,0,0,0.8)',
                    border: selectedFaction === faction.id 
                      ? `2px solid ${faction.color}` 
                      : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#FFD700',
                      color: '#000',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      1
                    </div>
                  )}
                  {index === 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#C0C0C0',
                      color: '#000',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      2
                    </div>
                  )}
                  {index === 2 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#CD7F32',
                      color: '#000',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      3
                    </div>
                  )}
                  {index === 3 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#CD7F32',
                      color: '#000',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      4
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                    <img src={faction.emoji} alt={faction.name} style={{ width: '6rem' }} />
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    color: faction.color,
                    marginBottom: '0.25rem'
                  }}>
                    {faction.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    {faction.totalKarma.toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* User's Team and Contribution - Bottom of Screen */}
        {userFactionData ? (
          <div style={{
            padding: '1rem 2rem',
            background: `linear-gradient(135deg, ${userFactionData.color}22, ${userFactionData.color}44)`,
            borderRadius: '15px',
            border: `2px solid ${userFactionData.color}`,
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <p style={{ 
              fontSize: '1.2rem', 
              margin: '0 0 0.5rem 0', 
              color: userFactionData.color,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <img src={userFactionData.emoji} alt={userFactionData.name} style={{ width: '24px', height: '24px' }} />
              Your Team: {userFactionData.name}
            </p>
            <p style={{ 
              fontSize: '1rem', 
              margin: 0, 
              color: '#fff'
            }}>
              Points Contributed: {userContribution.toLocaleString()}
            </p>
          </div>
        ) : (
          <div style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '15px',
            border: '2px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '1.2rem', 
              margin: '0 0 0.5rem 0', 
              color: '#fff',
              fontWeight: 'bold'
            }}>
              Your Team: No Team
            </p>
            <p style={{ 
              fontSize: '1rem', 
              margin: 0, 
              color: '#fff'
            }}>
              Points Contributed: 0
            </p>
          </div>
        )}

        <p className="racing-subtitle" style={{ fontSize: '1rem', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          Welcome, {username}!
        </p>
        
        <button
          className="racing-subtitle"
          onClick={handleStartGame}
          style={{
            fontSize: '1.8rem',
            padding: '1rem 3rem',
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
          Start Race
        </button>
      </div>
    );
  }

  // Render other screens
  if (gameScreen === 'factions') {
    return <FactionScreen factions={factions} onFactionSelect={handleFactionSelect} />;
  }

  if (gameScreen === 'rules') {
    return <RulesScreen onStartRace={handleStartRace} onBackToMenu={handleBackToMenu} />;
  }

  if (gameScreen === 'end' && gameResult) {
    return (
      <EndScreen 
        gameResult={gameResult}
        selectedFaction={selectedFaction}
        factions={factions}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Default: Playing screen
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RaceCanvas track={track} username={username} avatarUrl={avatarUrl} onRunEnd={handleEndGame} />
    </div>
  );
}
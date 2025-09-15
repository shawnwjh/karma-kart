import { useMemo, useEffect, useState } from 'react';
import { generateTrack } from '../shared/track/generateTrack';
import { RaceCanvas } from './components/RaceCanvas';
import { TRACK } from './constants/gameConstants';
import type { InitResponse } from '../shared/types/api';
import type { GameScreen, GameResult } from './types/gameTypes';

export default function App() {
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameScreen, setGameScreen] = useState<GameScreen>('start');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  const track = useMemo(() => generateTrack('karma-kart-dev', {
    baseWidth: TRACK.BASE_WIDTH,
    widthAmp: TRACK.WIDTH_AMP,
    radius: TRACK.RADIUS,
    spacing: TRACK.SPACING
  }), []);

  // Fetch current user from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/init');
        const data: InitResponse = await response.json();
        setUsername(data.username);
        
        // Check for cached avatar first
        const cachedAvatarKey = `avatar_${data.username}`;
        const cachedAvatar = localStorage.getItem(cachedAvatarKey);
        
        if (cachedAvatar) {
          setAvatarUrl(cachedAvatar);
          // Still preload the cached image
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = cachedAvatar;
        }
        
        // Fetch fresh avatar data (and update cache if different)
        if (data.username && data.username !== 'anonymous') {
          try {
            const avatarResponse = await fetch(`/api/avatar/${data.username}`);
            if (avatarResponse.ok) {
              const avatarData = await avatarResponse.json();
              if (avatarData.avatarUrl) {
                // Update if different from cache
                if (avatarData.avatarUrl !== cachedAvatar) {
                  setAvatarUrl(avatarData.avatarUrl);
                  localStorage.setItem(cachedAvatarKey, avatarData.avatarUrl);
                }
                // Preload the image
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
        // Fallback to anonymous if API fails
        setUsername('anonymous');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleStartGame = () => {
    setGameScreen('rules');
    setGameResult(null);
  };

  const handleStartRace = () => {
    setGameScreen('playing');
    setGameResult(null);
  };

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setGameScreen('end');
  };

  const handlePlayAgain = () => {
    setGameScreen('rules');
    setGameResult(null);
  };

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

  // Start Screen
  if (gameScreen === 'start') {
    return (
      <div className="start-screen" style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img src="/karma-kart-clear.png" style={{width: '6rem'}} />
        <h1 className="racing-title" style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
          Karma Kart
        </h1>
        <p className="racing-subtitle" style={{ fontSize: '1rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
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

  // Rules Screen
  if (gameScreen === 'rules') {
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
        <h1 className="racing-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
          How to Race
        </h1>
        
        <div className="racing-text" style={{ 
          fontSize: '1.3rem', 
          maxWidth: '600px', 
          textAlign: 'center', 
          marginBottom: '0.5rem', 
          lineHeight: '1.8',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>🎯 Objective:</strong> Collect upvotes and downvotes around the track!
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>🏎️ Controls:</strong> Arrow keys or A/D to steer • Touch left/right side of screen on mobile
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            🏁 Cross the finish line to respawn all pickups
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            ⏱️ You have 30 seconds to collect as many upvotes as possible!
          </div>
        </div>

        <button
          className="racing-subtitle"
          onClick={handleStartRace}
          style={{
            fontSize: '2rem',
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
          Lets go!
        </button>
      </div>
    );
  }

  // End Screen
  if (gameScreen === 'end' && gameResult) {
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
        <div className="racing-text" style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '3rem', lineHeight: '1.6', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>↑ Upvotes: {gameResult.up}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#E53935', fontWeight: 'bold' }}>↓ Downvotes: {gameResult.down}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Time: {(gameResult.timeMs / 1000).toFixed(1)}s</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Distance: {gameResult.distance.toFixed(0)}m</span>
          </div>
        </div>
        <button
          className="racing-subtitle"
          onClick={handlePlayAgain}
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
          Play Again
        </button>
      </div>
    );
  }

  // Playing Screen
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RaceCanvas track={track} username={username} avatarUrl={avatarUrl} onRunEnd={handleGameEnd} />
    </div>
  );
}
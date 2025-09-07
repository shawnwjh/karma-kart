import { useMemo, useEffect, useState } from 'react';
import { generateTrack } from '../shared/track/generateTrack';
import { RaceCanvas } from './components/RaceCanvas';
import type { InitResponse } from '../shared/types/api';
import type { GameScreen, GameResult } from './types/gameTypes';

export default function App() {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [gameScreen, setGameScreen] = useState<GameScreen>('start');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  const track = useMemo(() => generateTrack('karma-kart-dev'), []);

  // Fetch current user from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/init');
        const data: InitResponse = await response.json();
        setUsername(data.username);
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
    setGameScreen('playing');
    setGameResult(null);
  };

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setGameScreen('end');
  };

  const handlePlayAgain = () => {
    setGameScreen('playing');
    setGameResult(null);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // Start Screen
  if (gameScreen === 'start') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🏁 Karma Kart
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '3rem', textAlign: 'center', maxWidth: '600px' }}>
          Race around the track and collect upvotes and downvotes!<br/>
          Cross the finish line to respawn all pickups.
        </p>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Welcome, {username}!
        </p>
        <button
          onClick={handleStartGame}
          style={{
            fontSize: '2rem',
            padding: '1rem 3rem',
            background: '#ff5700',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
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
          🚗 Start Race
        </button>
        <div style={{ position: 'absolute', bottom: '2rem', fontSize: '1rem', opacity: 0.8 }}>
          Use arrow keys or A/D to steer • Touch left/right side of screen on mobile
        </div>
      </div>
    );
  }

  // End Screen
  if (gameScreen === 'end' && gameResult) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🏁 Race Complete!
        </h1>
        <div style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '3rem', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#4CAF50' }}>↑ Upvotes: {gameResult.up}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#E53935' }}>↓ Downvotes: {gameResult.down}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            Time: {(gameResult.timeMs / 1000).toFixed(1)}s
          </div>
          <div>
            Distance: {gameResult.distance.toFixed(0)}m
          </div>
        </div>
        <button
          onClick={handlePlayAgain}
          style={{
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            background: '#ff5700',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
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
          🔄 Play Again
        </button>
      </div>
    );
  }

  // Playing Screen
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RaceCanvas track={track} username={username} onRunEnd={handleGameEnd} />
    </div>
  );
}
import { useMemo, useEffect, useState } from 'react';
import { generateTrack } from '../shared/track/generateTrack';
import { RaceCanvas } from './components/RaceCanvas';
import type { InitResponse } from '../shared/types/api';

export default function App() {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
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

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RaceCanvas track={track} username={username} />
    </div>
  );
}
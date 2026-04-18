import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';
import Confetti from 'react-confetti';
import { useTheme } from '@/contexts/ThemeContext';

export default function SeasonalDecorations() {
  const { theme } = useTheme();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only show decorations if seasonal theme is enabled
  if (theme.mode !== 'seasonal' || !theme.seasonal_enabled) {
    return null;
  }

  // Christmas - Snowflakes
  if (theme.seasonal_theme === 'christmas') {
    return (
      <>
        <Snowfall
          color="#fff"
          snowflakeCount={50}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
        {/* Christmas lights effect */}
        <div className="christmas-lights" />
      </>
    );
  }

  // New Year - Confetti
  if (theme.seasonal_theme === 'newyear') {
    return (
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={100}
        recycle={true}
        colors={['#FFD700', '#C0C0C0', '#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={{
          position: 'fixed',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      />
    );
  }

  // Valentine - Floating hearts
  if (theme.seasonal_theme === 'valentine') {
    return (
      <div className="valentine-hearts">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="floating-heart"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            ❤️
          </div>
        ))}
      </div>
    );
  }

  // Halloween - Floating bats and pumpkins
  if (theme.seasonal_theme === 'halloween') {
    return (
      <div className="halloween-decorations">
        {[...Array(10)].map((_, i) => (
          <div
            key={`bat-${i}`}
            className="floating-bat"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          >
            🦇
          </div>
        ))}
        {[...Array(5)].map((_, i) => (
          <div
            key={`pumpkin-${i}`}
            className="floating-pumpkin"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            🎃
          </div>
        ))}
      </div>
    );
  }

  return null;
}

import React, { useEffect } from 'react';
import { Truck } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', fullScreen = false, text = 'Loading...', rotationSpeed = 'normal' }) => {
  const sizes = {
    sm: {
      van: 12,
      orbitRadius: 30,
      text: '10px'
    },
    md: {
      van: 16,
      orbitRadius: 40,
      text: '12px'
    },
    lg: {
      van: 20,
      orbitRadius: 50,
      text: '14px'
    }
  };

  // Set rotation speed (faster = shorter animation time)
  const getAnimationDuration = () => {
    switch (rotationSpeed) {
      case 'fast':
        return '1.2s';  // Very fast - completes quickly
      case 'slow':
        return '2.5s';  // Slow
      default:
        return '1.5s';  // Normal - will complete 2 rotations in 3 seconds
    }
  };

  const animationDuration = getAnimationDuration();

  // Inject custom CSS for the van driving animation
  useEffect(() => {
    if (!document.getElementById('valhala-driving-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'valhala-driving-styles';
      styleSheet.textContent = `
        /* The outer container rotates to position the van on the circle */
        @keyframes valhalaOrbit {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* The inner van rotates opposite to stay facing forward */
        @keyframes valhalaVanFace {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }
        
        .valhala-orbit {
          animation: valhalaOrbit ${animationDuration} linear infinite !important;
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: -${sizes[size].orbitRadius}px;
          margin-left: -${sizes[size].orbitRadius}px;
          width: ${sizes[size].orbitRadius * 2}px;
          height: ${sizes[size].orbitRadius * 2}px;
        }
        
        .valhala-van-wrapper {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          margin-top: -${sizes[size].van / 2}px;
        }
        
        .valhala-van-facing {
          animation: valhalaVanFace ${animationDuration} linear infinite !important;
          display: inline-block;
        }
        
        .valhala-van-pulse {
          animation: valhalaPulse 1.5s ease-in-out infinite !important;
        }
        
        @keyframes valhalaPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, [sizes, size, animationDuration]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px'
  };

  const trackContainerStyle = {
    width: sizes[size].orbitRadius * 2,
    height: sizes[size].orbitRadius * 2,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const trackStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '1.5px dashed rgba(233, 69, 96, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0
  };

  const spinnerContent = (
    <div style={containerStyle}>
      {/* Circular Track with Van Driving */}
      <div style={trackContainerStyle}>
        <div style={trackStyle} />
        
        {/* Orbit container that rotates around the center */}
        <div className="valhala-orbit">
          {/* Van wrapper at the top of the circle */}
          <div className="valhala-van-wrapper">
            {/* Van that counter-rotates to face forward */}
            <div className="valhala-van-facing">
              <Truck 
                size={sizes[size].van} 
                color="#e94560"
                strokeWidth={1.5}
                fill="none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="valhala-van-pulse">
        <p style={{ color: '#9ca3af', fontSize: sizes[size].text, margin: 0 }}>{text}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'rgba(26, 26, 46, 0.5)',
          borderRadius: '24px',
          padding: '30px'
        }}>
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
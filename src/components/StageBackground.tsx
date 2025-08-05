import React from 'react';

export const StageBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ zIndex: 0 }}>
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-cyan-500/5" />

    {/* Static floating orbs - no movement to prevent shaking */}
    <div
      className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-400/8 to-pink-400/8 blur-3xl"
      style={{
        top: '20%',
        left: '10%',
      }}
    />
    <div
      className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-r from-cyan-400/8 to-blue-400/8 blur-3xl"
      style={{
        top: '30%',
        right: '15%',
      }}
    />
    <div
      className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-r from-pink-400/8 to-purple-400/8 blur-3xl"
      style={{
        bottom: '25%',
        left: '20%',
      }}
    />
    <div
      className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-r from-blue-400/8 to-cyan-400/8 blur-3xl"
      style={{
        bottom: '35%',
        right: '10%',
      }}
    />

    {/* Static light rays - no animation to prevent shaking */}
    <div
      className="absolute w-[1px] h-[40vh] bg-gradient-to-b from-transparent via-purple-400/15 to-transparent left-[15%]"
      style={{
        top: '25%',
      }}
    />
    <div
      className="absolute w-[1px] h-[40vh] bg-gradient-to-b from-transparent via-pink-400/15 to-transparent left-[35%]"
      style={{
        top: '25%',
      }}
    />
    <div
      className="absolute w-[1px] h-[40vh] bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent left-[55%]"
      style={{
        top: '25%',
      }}
    />
    <div
      className="absolute w-[1px] h-[40vh] bg-gradient-to-b from-transparent via-blue-400/15 to-transparent left-[75%]"
      style={{
        top: '25%',
      }}
    />

    {/* Static particle effects - no movement */}
    <div className="absolute inset-0" style={{ top: '20%', bottom: '20%' }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + (i % 2) * 15}%`,
          }}
        />
      ))}
    </div>

    {/* Subtle breathing effect for orbs - only opacity change */}
    <style>{`
      @keyframes breathe {
        0%, 100% { 
          opacity: 0.3;
        }
        50% { 
          opacity: 0.5;
        }
      }
      
      /* Apply breathing effect to orbs */
      .absolute.w-\\[400px\\] { animation: breathe 8s ease-in-out infinite; }
      .absolute.w-\\[300px\\] { animation: breathe 8s ease-in-out infinite; animation-delay: 2s; }
      .absolute.w-\\[350px\\] { animation: breathe 8s ease-in-out infinite; animation-delay: 4s; }
      .absolute.w-\\[250px\\] { animation: breathe 8s ease-in-out infinite; animation-delay: 1s; }
    `}</style>
  </div>
);

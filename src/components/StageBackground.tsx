import React from "react";

export const StageBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    {/* Spotlights */}
    <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,128,0.3)_0%,rgba(255,0,128,0.1)_30%,transparent_70%)] animate-spotlight left-[10%] top-[10%]" style={{ animationDelay: "0s" }} />
    <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,128,0.3)_0%,rgba(255,0,128,0.1)_30%,transparent_70%)] animate-spotlight right-[15%] top-[20%]" style={{ animationDelay: "2s" }} />
    <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,128,0.3)_0%,rgba(255,0,128,0.1)_30%,transparent_70%)] animate-spotlight left-[20%] bottom-[30%]" style={{ animationDelay: "4s" }} />
    <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,128,0.3)_0%,rgba(255,0,128,0.1)_30%,transparent_70%)] animate-spotlight right-[10%] bottom-[20%]" style={{ animationDelay: "1s" }} />
    {/* Lasers */}
    <div className="absolute w-[2px] h-[70vh] bg-gradient-to-b from-[#ff0080] via-[#00ff80] to-[#0080ff] left-[5%] animate-laser" style={{ animationDelay: "0s" }} />
    <div className="absolute w-[2px] h-[70vh] bg-gradient-to-b from-[#ff0080] via-[#00ff80] to-[#0080ff] left-[25%] animate-laser" style={{ animationDelay: "0.5s" }} />
    <div className="absolute w-[2px] h-[70vh] bg-gradient-to-b from-[#ff0080] via-[#00ff80] to-[#0080ff] left-[45%] animate-laser" style={{ animationDelay: "1s" }} />
    <div className="absolute w-[2px] h-[70vh] bg-gradient-to-b from-[#ff0080] via-[#00ff80] to-[#0080ff] left-[65%] animate-laser" style={{ animationDelay: "1.5s" }} />
    <div className="absolute w-[2px] h-[70vh] bg-gradient-to-b from-[#ff0080] via-[#00ff80] to-[#0080ff] left-[85%] animate-laser" style={{ animationDelay: "2s" }} />
    <style>{`
      @keyframes spotlight {
        0% { opacity: 0.2; transform: scale(1);}
        100% { opacity: 0.6; transform: scale(1.3);}
      }
      .animate-spotlight { animation: spotlight 6s ease-in-out infinite alternate; }
      @keyframes laser {
        0%,100% { opacity: 0.3; transform: rotate(0deg);}
        25% { opacity: 0.8; transform: rotate(2deg);}
        50% { opacity: 0.5; transform: rotate(-2deg);}
        75% { opacity: 0.9; transform: rotate(1deg);}
      }
      .animate-laser { animation: laser 3s linear infinite; }
    `}</style>
  </div>
); 
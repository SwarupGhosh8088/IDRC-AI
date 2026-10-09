import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-6">
          <img src="/logo.jpg" alt="IDRC-Ai Logo" className="w-12 h-12 rounded-md object-cover shadow-lg" />
          <div>
            <h1 className="font-bold text-3xl leading-tight text-textPrimary">IDRC-Ai</h1>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">Intelligence Rescue Co-ordination</p>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface py-8 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-borderSubtle sm:rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

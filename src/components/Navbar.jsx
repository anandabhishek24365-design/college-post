import React, { useState } from 'react';
import { Package, Shield, User, LogOut, Eye, Settings, Terminal } from 'lucide-react';
import { isFirebaseActive } from '../db';

export default function Navbar({ currentUser, onRoleOverride, activeRole, onLogout }) {
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <nav className="border-b border-campus-border bg-campus-card px-4 py-3 sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-campus-primary/20 text-campus-primary border border-campus-primary/40 p-2 rounded-lg">
            <Package className="h-6 w-6 animate-pulse-light" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-campus-text-main flex items-center gap-1.5">
              CAMPUS<span className="text-campus-accent">POST</span>
            </span>
            <div className="text-xs text-campus-text-muted font-mono leading-none mt-0.5">
              Courier Hub v1.0
            </div>
          </div>
        </div>

        {/* Database Status & Demo Controls */}
        <div className="flex items-center gap-3">
          {/* Active Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <span className={`h-1.5 w-1.5 rounded-full ${isFirebaseActive ? 'bg-campus-success' : 'bg-campus-accent animate-pulse'}`}></span>
            <span className="text-campus-text-muted">
              {isFirebaseActive ? 'Firestore Live' : 'LocalStorage Offline Engine'}
            </span>
          </div>

          {/* Quick-Switch Toggle for testing */}
          <div className="relative">
            <button 
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-campus-border bg-campus-bg hover:border-campus-accent hover:text-campus-accent text-xs font-semibold cursor-pointer transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Role Switcher</span>
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-campus-card border border-campus-border rounded-lg shadow-xl py-1.5 z-50 font-sans">
                <div className="px-3 py-1 text-[10px] text-campus-text-muted uppercase font-bold tracking-wider border-b border-campus-border/60 pb-1 mb-1">
                  Evaluate Perspectives
                </div>
                <button
                  onClick={() => { onRoleOverride('student'); setShowDemoMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-campus-card-hover flex items-center gap-2 ${activeRole === 'student' ? 'text-campus-accent font-bold' : 'text-campus-text-main'}`}
                >
                  <Eye className="h-3.5 w-3.5 text-campus-text-muted" />
                  <span>Student Portal</span>
                </button>
                <button
                  onClick={() => { onRoleOverride('staff'); setShowDemoMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-campus-card-hover flex items-center gap-2 ${activeRole === 'staff' ? 'text-campus-primary font-bold' : 'text-campus-text-main'}`}
                >
                  <User className="h-3.5 w-3.5 text-campus-text-muted" />
                  <span>Staff Workspace</span>
                </button>
                <button
                  onClick={() => { onRoleOverride('admin'); setShowDemoMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-campus-card-hover flex items-center gap-2 ${activeRole === 'admin' ? 'text-purple-400 font-bold' : 'text-campus-text-main'}`}
                >
                  <Shield className="h-3.5 w-3.5 text-campus-text-muted" />
                  <span>Admin Dashboard</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User profile & signout */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-campus-text-main leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono text-campus-text-muted">
                  {currentUser.email}
                </div>
              </div>
              
              <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-campus-primary/10 text-campus-primary border border-campus-primary/30">
                {currentUser.role}
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg border border-campus-border hover:border-campus-danger hover:text-campus-danger text-campus-text-muted cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-campus-text-muted italic">
                {activeRole === 'student' ? 'Student View' : 'Demo Profile'}
              </span>
              <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                {activeRole}
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

import React from 'react';
import { PackageOpen, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export default function DashboardStats({ packages }) {
  // Helpers to check date
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const targetDate = new Date(dateString);
    return (
      today.getDate() === targetDate.getDate() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getFullYear() === targetDate.getFullYear()
    );
  };

  // Calculations
  const todayInbound = packages.filter(pkg => isToday(pkg.dateReceived)).length;
  const activeHolding = packages.filter(pkg => pkg.status === 'Received').length;
  
  const todayCollectedPkgs = packages.filter(pkg => 
    pkg.status === 'Collected' && isToday(pkg.collectionDate)
  );
  const todayCollectedCount = todayCollectedPkgs.length;

  // Clearance rate for today: (Collected Today / Received Today) * 100
  // Or if no inbound today, base it on the overall system or output 100% if empty
  const clearanceRate = todayInbound > 0 
    ? Math.round((todayCollectedCount / todayInbound) * 100) 
    : (activeHolding === 0 ? 100 : 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
      
      {/* Total Received Today Card */}
      <div className="campus-panel campus-panel-interactive p-4 relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-campus-text-muted">
            Today's Inbound
          </span>
          <div className="text-3xl font-extrabold text-campus-text-main flex items-baseline gap-2">
            <span>{todayInbound}</span>
            <span className="text-xs font-semibold text-campus-success flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> New
            </span>
          </div>
          <p className="text-[11px] text-campus-text-muted">Packages checked-in today</p>
        </div>
        <div className="p-3 rounded-lg bg-campus-primary/10 text-campus-primary border border-campus-primary/20">
          <PackageOpen className="h-6 w-6" />
        </div>
        {/* Glow border for visual distinction */}
        <div className="absolute top-0 left-0 w-1 h-full bg-campus-primary"></div>
      </div>

      {/* Active Holding Card */}
      <div className="campus-panel campus-panel-interactive p-4 relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-campus-text-muted">
            Active Holding
          </span>
          <div className="text-3xl font-extrabold text-campus-accent flex items-baseline gap-2">
            <span>{activeHolding}</span>
            {activeHolding > 10 && (
              <span className="text-[10px] bg-campus-accent/10 text-campus-accent px-1.5 py-0.5 rounded border border-campus-accent/20">
                High Vol
              </span>
            )}
          </div>
          <p className="text-[11px] text-campus-text-muted">Awaiting collection on shelves</p>
        </div>
        <div className="p-3 rounded-lg bg-campus-accent/10 text-campus-accent border border-campus-accent/20">
          <Clock className="h-6 w-6 animate-pulse-light" />
        </div>
        <div className="absolute top-0 left-0 w-1 h-full bg-campus-accent"></div>
      </div>

      {/* Clearance Rate Card */}
      <div className="campus-panel campus-panel-interactive p-4 relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-campus-text-muted">
            Clearance Rate
          </span>
          <div className="text-3xl font-extrabold text-campus-success flex items-baseline gap-1.5">
            <span>{clearanceRate}%</span>
            <span className="text-xs font-normal text-campus-text-muted">
              ({todayCollectedCount} of {todayInbound})
            </span>
          </div>
          <p className="text-[11px] text-campus-text-muted">Inbound collected today</p>
        </div>
        <div className="p-3 rounded-lg bg-campus-success/10 text-campus-success border border-campus-success/20">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="absolute top-0 left-0 w-1 h-full bg-campus-success"></div>
      </div>

    </div>
  );
}

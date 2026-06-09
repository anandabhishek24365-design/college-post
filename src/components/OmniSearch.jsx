import React, { useState, useEffect } from 'react';
import { Search, Barcode, UserCheck, PackagePlus, ArrowRight } from 'lucide-react';

export default function OmniSearch({ onRouteIntake, onRoutePickup, packages }) {
  const [query, setQuery] = useState('');
  const [detectedType, setDetectedType] = useState(null); // 'tracking' | 'student' | null
  const [matchedStudentName, setMatchedStudentName] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDetectedType(null);
      setMatchedStudentName('');
      return;
    }

    // 1. Check if matches standard enrollment formats (e.g. contains slashes, or matched enrollment numbers in system)
    const isStudentFormat = /^[A-Za-z0-9]{2,}\/[A-Za-z0-9-/]+$/.test(trimmed) || 
                            /^[0-9]{6,}$/.test(trimmed) ||
                            packages.some(p => p.enrollmentNumber.toLowerCase() === trimmed.toLowerCase());

    // 2. Check if it looks like a carrier tracking number (starts with carrier code or is long alphanumeric)
    const isTrackingFormat = /^(1Z[A-Z0-9]{16}|DHL[0-9]+|FDX[0-9]+|AMZ[0-9]+|BD[0-9]+|[0-9]{10,20})$/i.test(trimmed) ||
                             (trimmed.length >= 8 && !trimmed.includes('/') && /^[A-Z0-9]+$/i.test(trimmed));

    if (isStudentFormat) {
      setDetectedType('student');
      // Look up student name in system
      const foundPkg = packages.find(p => p.enrollmentNumber.toLowerCase() === trimmed.toLowerCase());
      setMatchedStudentName(foundPkg ? foundPkg.studentName : 'New Student ID');
    } else if (isTrackingFormat) {
      setDetectedType('tracking');
      setMatchedStudentName('');
    } else {
      setDetectedType(null);
      setMatchedStudentName('');
    }
  }, [query, packages]);

  const handleAction = () => {
    if (detectedType === 'student') {
      onRoutePickup(query.trim());
      setQuery('');
    } else if (detectedType === 'tracking') {
      onRouteIntake(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAction();
    }
  };

  return (
    <div className="campus-panel p-4 mb-6 relative overflow-hidden scan-indicator bg-slate-900 border-campus-border no-print">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Icon & Description */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-lg bg-campus-accent/10 text-campus-accent border border-campus-accent/20">
            <Barcode className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-campus-text-main leading-tight">
              Omni-Search Bar
            </h2>
            <p className="text-xs text-campus-text-muted">
              Scan carrier tracking label OR student ID card
            </p>
          </div>
        </div>

        {/* Input Box */}
        <div className="relative w-full md:flex-1 max-w-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode, enter tracking number or enrollment number..."
            className="w-full pl-10 pr-12 py-2 rounded-lg bg-campus-card border border-campus-border text-campus-text-main text-sm focus:outline-none focus:border-campus-primary focus:ring-1 focus:ring-campus-primary font-mono transition-all placeholder:text-campus-text-muted"
          />
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-campus-text-muted" />
          {query && (
            <button 
              onClick={handleAction}
              className="absolute right-2 top-1.5 px-2.5 py-1 bg-campus-primary hover:bg-campus-primary-hover text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Go</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

      </div>

      {/* Intelligent Routing Tooltip */}
      {detectedType && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded bg-campus-card border border-campus-border animate-fade-in text-xs">
          {detectedType === 'student' ? (
            <>
              <UserCheck className="h-4.5 w-4.5 text-campus-success shrink-0" />
              <div className="flex-1">
                Detected <span className="font-mono text-campus-success font-semibold">{query}</span> 
                {matchedStudentName && <span> ({matchedStudentName})</span>} as Student ID.
              </div>
              <button 
                onClick={() => { onRoutePickup(query.trim()); setQuery(''); }}
                className="px-2 py-0.5 bg-campus-success/20 text-campus-success border border-campus-success/30 hover:bg-campus-success/30 rounded text-[11px] font-bold cursor-pointer"
              >
                Open Pickup Profile
              </button>
            </>
          ) : (
            <>
              <PackagePlus className="h-4.5 w-4.5 text-campus-accent shrink-0" />
              <div className="flex-1">
                Detected <span className="font-mono text-campus-accent font-semibold">{query}</span> as Carrier Tracking Number.
              </div>
              <button 
                onClick={() => { onRouteIntake(query.trim()); setQuery(''); }}
                className="px-2 py-0.5 bg-campus-accent/20 text-campus-accent border border-campus-accent/30 hover:bg-campus-accent/30 rounded text-[11px] font-bold cursor-pointer"
              >
                Log Intake
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

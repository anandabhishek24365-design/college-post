import React, { useState } from 'react';
import { Search, Package, Sparkles, HelpCircle, CheckCircle, Clock, Lock } from 'lucide-react';

export default function StudentPortal({ packages, students = [] }) {
  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isStudentInactive, setIsStudentInactive] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = enrollmentInput.trim().toUpperCase();
    if (!trimmed) return;

    // Check if student exists and is deactivated
    const student = students.find(s => s.enrollmentNumber.toUpperCase() === trimmed);
    const isInactive = student && student.status === 'inactive';

    setSearchedId(trimmed);
    setHasSearched(true);

    if (isInactive) {
      setResults([]);
      setIsStudentInactive(true);
      return;
    }

    setIsStudentInactive(false);
    // Filter packages matching this enrollment number
    const matched = packages.filter(pkg => 
      pkg.enrollmentNumber.toUpperCase() === trimmed
    );

    setResults(matched);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Student Welcome & Search card */}
      <div className="campus-panel p-5 bg-slate-900 border-campus-border relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-campus-primary/10 rounded-full blur-2xl"></div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-campus-accent">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Student Courier Lookup</span>
          </div>
          
          <h2 className="text-xl font-extrabold text-campus-text-main">
            Is Your Package Ready?
          </h2>
          <p className="text-xs text-campus-text-muted leading-relaxed">
            Enter your official university Enrollment Number below to check the real-time status of your inbound packages, mail, or online deliveries.
          </p>

          <form onSubmit={handleSearch} className="pt-2 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={enrollmentInput}
                onChange={(e) => setEnrollmentInput(e.target.value)}
                placeholder="e.g. BT/CSE/2023/045"
                className="w-full pl-9 pr-3 py-2 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-accent font-mono uppercase"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-campus-text-muted" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-campus-accent hover:bg-campus-accent-hover text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              Check Status
            </button>
          </form>
        </div>
      </div>

      {/* Search Results Display */}
      {hasSearched && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-campus-border/60 pb-2">
            <h3 className="text-xs font-mono uppercase text-campus-text-muted font-bold">
              Results for: <span className="text-campus-text-main font-mono">{searchedId}</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-campus-text-muted px-2 py-0.5 rounded font-mono">
              Found {isStudentInactive ? 0 : results.length} record(s)
            </span>
          </div>

          {isStudentInactive ? (
            <div className="campus-panel p-6 text-center bg-campus-card border-campus-border border-l-4 border-l-campus-danger space-y-2">
              <Lock className="h-8 w-8 text-campus-danger mx-auto animate-pulse" />
              <h4 className="text-xs font-bold text-campus-danger uppercase">Student Profile Deactivated</h4>
              <p className="text-xs text-campus-text-muted max-w-sm mx-auto">
                Your student profile (<strong className="font-mono text-campus-text-main">{searchedId}</strong>) has been deactivated by the Courier Room Admin. Package status checks cannot be displayed. Please bring your University ID Card to the Courier Room to reactivate your profile.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="campus-panel p-6 text-center bg-campus-card border-campus-border space-y-2">
              <Package className="h-8 w-8 text-campus-text-muted mx-auto animate-pulse" />
              <h4 className="text-xs font-bold text-campus-text-main uppercase">No Packages Cataloged</h4>
              <p className="text-xs text-campus-text-muted max-w-sm mx-auto">
                No parcels have been logged for enrollment number <strong className="font-mono text-campus-text-main">{searchedId}</strong> today. If you received a carrier delivery confirmation, it may still be in processing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`campus-panel p-4 bg-campus-card border-l-4 transition-all ${
                    pkg.status === 'Collected' 
                      ? 'border-l-campus-success border-campus-border/80' 
                      : 'border-l-campus-accent border-campus-accent/35 campus-border-glow-accent bg-gradient-to-r from-campus-accent/5 to-transparent'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Package Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-campus-text-muted uppercase font-mono">Student Name:</span>
                        <span className="text-xs font-extrabold text-campus-text-main">{pkg.studentName}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-campus-text-muted uppercase font-mono">Carrier:</span>
                        <span className="text-xs font-semibold text-campus-text-main">{pkg.courierCompany}</span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-campus-text-muted uppercase font-mono">Received:</span>
                        <span className="text-xs text-campus-text-muted font-mono">
                          {new Date(pkg.dateReceived).toLocaleString()}
                        </span>
                      </div>

                      {pkg.status === 'Collected' && pkg.collectionDate && (
                        <div className="flex items-baseline gap-2 text-campus-success/80">
                          <span className="text-xs font-bold font-mono uppercase">Collected:</span>
                          <span className="text-xs font-mono">
                            {new Date(pkg.collectionDate).toLocaleString()} (Verified by {pkg.verifiedBy})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">
                      
                      {/* Status Indicator */}
                      {pkg.status === 'Received' ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-campus-accent/10 border border-campus-accent/35 text-campus-accent text-[10px] font-extrabold uppercase font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Ready for Collection</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-campus-success/10 border border-campus-success/35 text-campus-success text-[10px] font-extrabold uppercase font-mono">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Collected / Handed Over</span>
                        </div>
                      )}

                      {/* Storage Shelf Indicator (if ready) */}
                      {pkg.status === 'Received' && (
                        <div className="text-left sm:text-right">
                          <span className="block text-[9px] font-mono text-campus-text-muted uppercase">Storage Shelf</span>
                          <span className="text-sm font-extrabold font-mono text-campus-accent">
                            {pkg.shelfLocation}
                          </span>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Instructions for student */}
                  {pkg.status === 'Received' && (
                    <div className="mt-3.5 p-2 bg-slate-900/60 border border-campus-border/40 rounded text-[11px] text-campus-text-muted flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-campus-accent shrink-0 pt-0.5" />
                      <p>
                        Please proceed to the Courier Room and show your physical <strong>University ID Card</strong> to the staff. Reference storage location <strong className="font-mono text-campus-accent">{pkg.shelfLocation}</strong> to speed up retrieval.
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

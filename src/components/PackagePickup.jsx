import React, { useState, useEffect } from 'react';
import { UserCheck, Check, ShieldAlert, Award, Calendar, ChevronRight, X, AlertCircle, ExternalLink } from 'lucide-react';
import { markPackageCollected } from '../db';

export default function PackagePickup({ studentId, packages, onComplete, currentUser, students = [] }) {
  const [matchingPkgs, setMatchingPkgs] = useState([]);
  const [studentName, setStudentName] = useState('');
  
  // Handover Checklist State
  const [checkedName, setCheckedName] = useState(false);
  const [checkedId, setCheckedId] = useState(false);
  const [checkedCard, setCheckedCard] = useState(false);
  
  const [verifierName, setVerifierName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (studentId && packages.length > 0) {
      // Find all pending packages for this student ID
      const pending = packages.filter(p => 
        p.enrollmentNumber.toLowerCase() === studentId.toLowerCase() && 
        p.status === 'Received'
      );
      setMatchingPkgs(pending);
      if (pending.length > 0) {
        setStudentName(pending[0].studentName);
      } else {
        // Look up collected packages just to get the student's name if any
        const anyPkg = packages.find(p => p.enrollmentNumber.toLowerCase() === studentId.toLowerCase());
        setStudentName(anyPkg ? anyPkg.studentName : 'Unknown Student');
      }
    }
  }, [studentId, packages]);

  // Sync verifier name with logged in user
  useEffect(() => {
    if (currentUser) {
      setVerifierName(currentUser.name);
    }
  }, [currentUser]);

  const studentProfile = students.find(s => s.enrollmentNumber.toLowerCase() === studentId.toLowerCase());
  const isStudentInactive = studentProfile && studentProfile.status === 'inactive';
  const isAdmin = currentUser?.role === 'admin';
  const allVerified = checkedName && checkedId && checkedCard && verifierName.trim().length > 0 && (!isStudentInactive || isAdmin);

  const handleHandover = async () => {
    if (!allVerified) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Hand over all matching pending packages for this student
      for (const pkg of matchingPkgs) {
        await markPackageCollected(pkg.id, verifierName.trim(), currentUser?.email);
      }

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        // Clear checklist
        setCheckedName(false);
        setCheckedId(false);
        setCheckedCard(false);
        if (onComplete) onComplete();
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to finalize handover.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="campus-panel p-5 bg-campus-card border-campus-border relative overflow-hidden no-print">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-campus-border/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-campus-success animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-campus-text-main">
            Student Pickup Verification
          </h3>
        </div>
        <button 
          onClick={onComplete}
          className="text-campus-text-muted hover:text-campus-text-main cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {successMsg ? (
        <div className="py-8 text-center space-y-3 animate-fade-in">
          <div className="inline-flex p-3 rounded-full bg-campus-success/15 text-campus-success border border-campus-success/40">
            <Check className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-base font-bold text-campus-success">Handover Finalized Successfully</h4>
          <p className="text-xs text-campus-text-muted">Database updated and activity logs recorded.</p>
        </div>
      ) : (
        <div className="space-y-4 font-sans">
          
          {errorMsg && (
            <div className="p-2.5 rounded bg-campus-danger/10 border border-campus-danger/30 text-campus-danger text-xs">
              {errorMsg}
            </div>
          )}

          {isStudentInactive && (
            <div className="p-3 rounded bg-campus-danger/15 border border-campus-danger/45 text-campus-danger text-xs flex items-start gap-2.5 font-sans leading-relaxed">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block uppercase tracking-wider font-extrabold text-[10px] mb-0.5">Account Deactivated</strong>
                This student account has been deactivated. Handover is locked. {isAdmin ? "As Admin, you can bypass this lock." : "Please refer the student to the Admin Office to activate their directory profile."}
              </div>
            </div>
          )}

          {/* Student Profile Info */}
          {(() => {
            const studentProfile = students.find(s => s.enrollmentNumber.toLowerCase() === studentId.toLowerCase());
            return (
              <div className="p-3.5 rounded bg-slate-900 border border-campus-border/80 flex items-center gap-4">
                {studentProfile && studentProfile.photo ? (
                  <div className="relative shrink-0">
                    <img 
                      src={studentProfile.photo} 
                      alt="Student verification avatar" 
                      className="h-14 w-14 rounded-lg object-cover border border-campus-border shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.nextSibling;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      style={{ display: 'none' }}
                      className="h-14 w-14 rounded-lg bg-campus-primary/20 border border-campus-primary/30 flex items-center justify-center text-xs font-bold text-campus-primary uppercase font-mono"
                    >
                      {studentProfile.name ? studentProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                    </div>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-campus-primary/20 border border-campus-primary/30 flex items-center justify-center text-xs font-bold text-campus-primary uppercase font-mono shrink-0">
                    {studentProfile && studentProfile.name ? studentProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NO PIC'}
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-extrabold text-campus-text-main">
                      {studentName}
                    </span>
                    <span className="text-xs font-mono font-bold bg-campus-primary/10 border border-campus-primary/30 px-2 py-0.5 rounded text-campus-primary">
                      ID: {studentId.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-campus-text-muted flex justify-between items-center">
                    <span>Pending Packages: <strong className="text-campus-accent font-bold">{matchingPkgs.length}</strong></span>
                    {studentProfile && studentProfile.photo && (studentProfile.photo.startsWith('http://') || studentProfile.photo.startsWith('https://')) ? (
                      <a 
                        href={studentProfile.photo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] font-mono text-campus-accent hover:underline flex items-center gap-0.5 bg-campus-accent/5 px-1.5 py-0.2 rounded border border-campus-accent/20 cursor-pointer"
                        title="Verify Student Photo on external link"
                      >
                        <ExternalLink className="h-2 w-2" />
                        <span>Google Photos</span>
                      </a>
                    ) : (
                      <span>Classroom status: <strong className="text-campus-success font-semibold">Active</strong></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {matchingPkgs.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-campus-text-muted mx-auto" />
              <p className="text-xs text-campus-text-muted">No pending packages found awaiting collection for this ID.</p>
              <button
                onClick={onComplete}
                className="mt-2 text-xs text-campus-primary hover:underline font-bold"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Package cards carousel/grid */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <div className="text-[10px] font-mono text-campus-text-muted uppercase tracking-wider">Packages Awaiting Pickup:</div>
                {matchingPkgs.map((pkg) => (
                  <div key={pkg.id} className="p-3 bg-campus-bg border border-campus-border rounded flex gap-3 items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-campus-text-main">{pkg.courierCompany}</span>
                        {pkg.trackingNumber && pkg.trackingNumber !== 'N/A' && (
                          <span className="text-[10px] font-mono text-campus-text-muted">({pkg.trackingNumber})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-campus-text-muted italic">
                        {pkg.packageDescription || 'No description'}
                      </div>
                      <div className="text-[10px] font-mono text-campus-text-muted">
                        Received: {new Date(pkg.dateReceived).toLocaleString()}
                      </div>
                    </div>
                    {/* BOLD SHELF NUMBER */}
                    <div className="text-center bg-campus-accent/15 border border-campus-accent/40 rounded px-3 py-1.5 shrink-0">
                      <div className="text-[8px] font-mono uppercase tracking-wider text-campus-accent font-bold">Location</div>
                      <div className="text-sm font-extrabold font-mono text-campus-accent">
                        {pkg.shelfLocation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo Verification Panel */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-campus-text-muted uppercase tracking-wider block">Inbound Package Image / Receipt Verification:</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {matchingPkgs.map((pkg) => (
                    pkg.packageImage ? (
                      <div key={pkg.id} className="relative shrink-0 border border-campus-border rounded overflow-hidden">
                        <img 
                          src={pkg.packageImage} 
                          alt="Package check-in" 
                          className="h-20 w-32 object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-mono text-center text-campus-accent py-0.5 font-bold">
                          {pkg.shelfLocation}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>

              {/* Security ID Verification Checkbox Checklist */}
              <div className="space-y-2 border-t border-campus-border/60 pt-3">
                <div className="text-[10px] font-mono text-campus-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-campus-accent" />
                  <span>Mandatory Handover Checklist</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2 rounded bg-campus-bg hover:bg-slate-900 border border-campus-border/40 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkedName}
                      onChange={(e) => setCheckedName(e.target.checked)}
                      className="mt-0.5 rounded border-campus-border text-campus-primary focus:ring-campus-primary cursor-pointer h-4 w-4"
                    />
                    <span className="text-xs text-campus-text-main">
                      Verify student name <strong>{studentName}</strong> matches university database record.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded bg-campus-bg hover:bg-slate-900 border border-campus-border/40 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkedId}
                      onChange={(e) => setCheckedId(e.target.checked)}
                      className="mt-0.5 rounded border-campus-border text-campus-primary focus:ring-campus-primary cursor-pointer h-4 w-4"
                    />
                    <span className="text-xs text-campus-text-main">
                      Verify enrollment number <strong className="font-mono">{studentId.toUpperCase()}</strong> matches.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded bg-campus-bg hover:bg-slate-900 border border-campus-border/40 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkedCard}
                      onChange={(e) => setCheckedCard(e.target.checked)}
                      className="mt-0.5 rounded border-campus-border text-campus-primary focus:ring-campus-primary cursor-pointer h-4 w-4"
                    />
                    <span className="text-xs text-campus-text-main">
                      Verify physical <strong>University ID Card</strong> photo matches the student standing in front of you.
                    </span>
                  </label>
                </div>
              </div>

              {/* Verifying Staff input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Verifying Staff Name</label>
                <input
                  type="text"
                  required
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-2.5 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                />
              </div>

              {/* Handover Action */}
              <button
                type="button"
                disabled={!allVerified || isSubmitting}
                onClick={handleHandover}
                className="w-full py-2.5 rounded bg-campus-success hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed border border-campus-success text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                <Award className="h-4.5 w-4.5" />
                <span>Mark as Collected ({matchingPkgs.length} Pkgs)</span>
              </button>
              
              {!allVerified && (
                <p className="text-[10px] text-center text-campus-text-muted italic">
                  {isStudentInactive && !isAdmin 
                    ? "* Access Denied: Handover locked for deactivated student profile. Only Admins can bypass."
                    : "* Note: Complete the security checklist and staff name to authorize collection."
                  }
                </p>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

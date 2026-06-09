import React, { useState, useEffect } from 'react';
import { 
  subscribePackages, 
  subscribeLogs, 
  subscribeStaff,
  subscribeStudents,
  isFirebaseActive 
} from './db';
import { subscribeAuth, login, logout } from './auth';

import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import OmniSearch from './components/OmniSearch';
import PackageIntake from './components/PackageIntake';
import PackagePickup from './components/PackagePickup';
import AdminPanel from './components/AdminPanel';
import StudentPortal from './components/StudentPortal';

import { 
  Lock, Eye, AlertCircle, RefreshCw, Box, ClipboardList, 
  CheckSquare, ArrowLeftRight, HelpCircle, Terminal
} from 'lucide-react';

export default function App() {
  const [packages, setPackages] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Active role can override the view perspective ('student' | 'staff' | 'admin')
  const [activeRole, setActiveRole] = useState('student');
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active OmniSearch routing states
  const [intakeTracking, setIntakeTracking] = useState('');
  const [pickupStudentId, setPickupStudentId] = useState('');
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  
  // Staff dashboard sub-view: 'inventory' | 'intake'
  const [staffTab, setStaffTab] = useState('inventory');

  // Subscriptions to database
  useEffect(() => {
    const unsubPkgs = subscribePackages((pkgs) => setPackages(pkgs));
    const unsubLogs = subscribeLogs((logs) => setActivityLogs(logs));
    const unsubStaff = subscribeStaff((staff) => setStaffList(staff));
    const unsubStudents = subscribeStudents((studs) => setStudents(studs));
    const unsubAuth = subscribeAuth((user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically switch role view to their user role
        setActiveRole(user.role);
      } else {
        // Fall back to student view if logged out
        setActiveRole('student');
      }
    });

    return () => {
      unsubPkgs();
      unsubLogs();
      unsubStaff();
      unsubStudents();
      unsubAuth();
    };
  }, []);

  // Handle Staff/Admin Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await login(loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Log Out
  const handleLogout = async () => {
    await logout();
  };

  // OmniSearch routing callbacks
  const handleRouteIntake = (tracking) => {
    setIntakeTracking(tracking);
    setShowIntakeForm(true);
    setPickupStudentId('');
    setStaffTab('intake');
  };

  const handleRoutePickup = (studentId) => {
    setPickupStudentId(studentId);
    setIntakeTracking('');
    setShowIntakeForm(false);
  };

  // Override active perspective for testing/evaluation
  const handleRoleOverride = (role) => {
    setActiveRole(role);
  };

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text-main flex flex-col font-sans selection:bg-campus-primary/30">
      
      {/* Navbar */}
      <Navbar 
        currentUser={currentUser} 
        activeRole={activeRole} 
        onRoleOverride={handleRoleOverride} 
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* If Student Perspective is selected */}
        {activeRole === 'student' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info */}
            <div className="text-center space-y-1 mb-2 no-print">
              <h1 className="text-2xl font-extrabold tracking-tight uppercase text-campus-text-main">
                NIIT UNIVERSITY COURIER DESK
              </h1>
              <p className="text-xs text-campus-text-muted">
                Student parcel, mail, and delivery status database.
              </p>
            </div>
            
            <StudentPortal packages={packages} students={students} />
          </div>
        )}

        {/* If Staff / Admin Perspective is selected and user is NOT logged in */}
        {(activeRole === 'staff' || activeRole === 'admin') && !currentUser && (
          <div className="max-w-md mx-auto py-10 animate-fade-in no-print">
            <div className="campus-panel p-6 bg-campus-card border-campus-border relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-campus-primary/5 rounded-full blur-xl"></div>
              
              <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="p-3 rounded-full bg-campus-primary/10 border border-campus-primary/20 text-campus-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-extrabold uppercase tracking-wider text-campus-text-main">
                  Desk Authorization Required
                </h2>
                <p className="text-xs text-campus-text-muted max-w-xs">
                  Access restricted to Courier Room staff and administrators. Please verify your credentials.
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-2.5 rounded bg-campus-danger/10 border border-campus-danger/35 text-campus-danger text-xs flex items-start gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Office Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. staff1@campus.edu"
                    className="w-full px-3 py-2 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Office Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors shadow-md"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Authenticate Account</span>
                  )}
                </button>
              </form>

              {/* DEMO LOGINS WIDGET FOR EASY REVIEW */}
              <div className="mt-6 border-t border-campus-border/60 pt-4 space-y-2">
                <span className="text-[10px] font-mono text-campus-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5 text-campus-accent" />
                  <span>Evaluation Credentials:</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 bg-slate-900 border border-campus-border/40 rounded">
                    <span className="block text-campus-accent font-bold">Admin Level</span>
                    <span className="block text-slate-300">admin@campus.edu</span>
                    <span className="block text-campus-text-muted">Pass: admin123</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-campus-border/40 rounded">
                    <span className="block text-campus-primary font-bold">Staff Level</span>
                    <span className="block text-slate-300">staff1@campus.edu</span>
                    <span className="block text-campus-text-muted">Pass: staff123</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* If Staff / Admin is logged in */}
        {currentUser && (
          <div className="space-y-6">
            
            {/* Live Stats */}
            <DashboardStats packages={packages} />

            {/* OmniSearch Tool */}
            <OmniSearch 
              onRouteIntake={handleRouteIntake} 
              onRoutePickup={handleRoutePickup} 
              packages={packages} 
            />

            {/* If Pickup Overlay is Triggered */}
            {pickupStudentId && (
              <div className="animate-fade-in no-print">
                <PackagePickup 
                  studentId={pickupStudentId} 
                  packages={packages} 
                  currentUser={currentUser} 
                  students={students}
                  onComplete={() => setPickupStudentId('')} 
                />
              </div>
            )}

            {/* STAFF WORKSPACE VIEW */}
            {activeRole === 'staff' && (
              <div className="space-y-4 animate-fade-in no-print">
                
                {/* Staff Sub-tabs */}
                <div className="flex border-b border-campus-border/60 bg-campus-card rounded-t-lg">
                  <button
                    onClick={() => { setStaffTab('inventory'); setShowIntakeForm(false); }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      staffTab === 'inventory' && !showIntakeForm
                        ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
                        : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Awaiting Deliveries</span>
                  </button>
                  <button
                    onClick={() => { setStaffTab('intake'); setShowIntakeForm(true); }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      staffTab === 'intake' || showIntakeForm
                        ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
                        : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
                    }`}
                  >
                    <Box className="h-4 w-4" />
                    <span>New Courier Intake</span>
                  </button>
                </div>

                {/* Sub-tab views */}
                {showIntakeForm ? (
                  <PackageIntake 
                    prefilledTracking={intakeTracking} 
                    currentUser={currentUser} 
                    students={students}
                    packages={packages}
                    onComplete={() => {
                      setIntakeTracking('');
                      setShowIntakeForm(false);
                      setStaffTab('inventory');
                    }} 
                  />
                ) : (
                  <div className="campus-panel overflow-hidden border-campus-border">
                    <div className="p-4 bg-slate-900 border-b border-campus-border flex justify-between items-center">
                      <span className="text-xs font-mono uppercase text-campus-text-muted font-bold">
                        Awaiting Student Pickup Checklist
                      </span>
                      <span className="text-[10px] text-campus-accent font-bold bg-campus-accent/10 border border-campus-accent/30 px-2 py-0.5 rounded">
                        {packages.filter(p => p.status === 'Received').length} Active Holding
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-campus-bg/75 border-b border-campus-border text-[11px] font-mono uppercase text-campus-text-muted">
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Enrollment No</th>
                            <th className="px-4 py-3">Carrier / Tracking</th>
                            <th className="px-4 py-3">Shelf Location</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-campus-border/60">
                          {packages.filter(p => p.status === 'Received').length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-8 text-campus-text-muted italic">
                                No packages awaiting collection in the room.
                              </td>
                            </tr>
                          ) : (
                            packages.filter(p => p.status === 'Received').map(pkg => (
                              <tr key={pkg.id} className="hover:bg-campus-card-hover/40">
                                <td className="px-4 py-3.5 font-bold text-campus-text-main">
                                  {pkg.studentName}
                                </td>
                                <td className="px-4 py-3.5 font-mono font-bold text-slate-300">
                                  {pkg.enrollmentNumber}
                                </td>
                                <td className="px-4 py-3.5 text-campus-text-muted">
                                  <div>{pkg.courierCompany}</div>
                                  <div className="text-[10px] font-mono">{pkg.trackingNumber || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-3.5 font-mono text-campus-accent font-extrabold text-sm">
                                  {pkg.shelfLocation}
                                </td>
                                <td className="px-4 py-3.5">
                                  <button
                                    onClick={() => handleRoutePickup(pkg.enrollmentNumber)}
                                    className="px-2.5 py-1 bg-campus-success hover:bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                                  >
                                    Verify & Handover
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ADMIN CONTROL PANEL VIEW */}
            {activeRole === 'admin' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Admin Quick Intake Toggle */}
                <div className="flex justify-end no-print">
                  <button
                    onClick={() => setShowIntakeForm(!showIntakeForm)}
                    className="px-3.5 py-1.5 rounded bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <Box className="h-4 w-4" />
                    <span>{showIntakeForm ? 'Close Intake Form' : 'Log New Intake'}</span>
                  </button>
                </div>

                {showIntakeForm && (
                  <div className="no-print">
                    <PackageIntake 
                      prefilledTracking={intakeTracking} 
                      currentUser={currentUser} 
                      students={students}
                      packages={packages}
                      onComplete={() => {
                        setIntakeTracking('');
                        setShowIntakeForm(false);
                      }} 
                    />
                  </div>
                )}

                <AdminPanel 
                  packages={packages} 
                  staffList={staffList} 
                  activityLogs={activityLogs} 
                  currentUser={currentUser} 
                  students={students}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-campus-border/60 bg-campus-card py-4 px-6 text-center text-[10px] text-campus-text-muted font-mono no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 University Courier Room Management System. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span>Powered by React + Tailwind v4 + Firebase</span>
            <span className="h-2 w-2 rounded-full bg-campus-success"></span>
            <span>Online</span>
          </span>
        </div>
      </footer>

    </div>
  );
}

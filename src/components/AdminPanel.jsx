import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Users, ClipboardList, Search, Filter, 
  Printer, UserPlus, Trash2, Calendar, FileSpreadsheet, FileText, Check, 
  AlertTriangle, Upload, UserCheck, X, FileUp, ListOrdered, Camera, ExternalLink
} from 'lucide-react';
import { addStaffAccount, deleteStaffAccount, addStudent, addStudentsBulk, toggleStudentStatus, deleteStudent } from '../db';

export default function AdminPanel({ packages, staffList, activityLogs, currentUser, students = [] }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'staff' | 'logs' | 'students'
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'Received' | 'Collected'
  const [filterCarrier, setFilterCarrier] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // New Staff State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffSuccess, setStaffSuccess] = useState(false);
  const [staffError, setStaffError] = useState('');

  // New Student (Manual) State
  const [studentEnroll, setStudentEnroll] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentPhotoInput, setStudentPhotoInput] = useState(null);
  const [studentSuccessMsg, setStudentSuccessMsg] = useState(false);
  const [studentErrorMsg, setStudentErrorMsg] = useState('');
  const studentPhotoRef = useRef(null);

  // Live Camera states/refs for manual student registration
  const [useStudentCamera, setUseStudentCamera] = useState(false);
  const studentVideoRef = useRef(null);
  const studentCanvasRef = useRef(null);

  // Bulk Student Uploader State
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Selected package for details modal
  const [selectedPkg, setSelectedPkg] = useState(null);

  const fileInputRef = useRef(null);

  // List of unique carriers for filter
  const carriers = ['all', ...new Set(packages.map(p => p.courierCompany))];

  // Filtering Logic (Packages)
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'all' || pkg.status === filterStatus;

    const matchesCarrier = 
      filterCarrier === 'all' || pkg.courierCompany === filterCarrier;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(pkg.dateReceived) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(pkg.dateReceived) <= end;
    }

    return matchesSearch && matchesStatus && matchesCarrier && matchesDate;
  });

  // Student filtering/searching
  const [studentSearch, setStudentSearch] = useState('');
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Enrollment Number', 'Courier Company', 'Tracking Number', 'Shelf Location', 'Date Received', 'Status', 'Collection Date', 'Verified By', 'Received By'];
    const rows = filteredPackages.map(pkg => [
      pkg.studentName,
      pkg.enrollmentNumber,
      pkg.courierCompany,
      pkg.trackingNumber || 'N/A',
      pkg.shelfLocation,
      new Date(pkg.dateReceived).toLocaleString(),
      pkg.status,
      pkg.collectionDate ? new Date(pkg.collectionDate).toLocaleString() : 'N/A',
      pkg.verifiedBy || 'N/A',
      pkg.receivedBy || 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campus_courier_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser printing
  const handlePrint = () => {
    window.print();
  };

  // Add Staff Account
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess(false);

    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      setStaffError('All fields are required');
      return;
    }

    try {
      await addStaffAccount({
        name: staffName.trim(),
        email: staffEmail.trim(),
        role: staffRole,
        password: staffPassword
      }, currentUser?.email);

      setStaffSuccess(true);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRole('staff');
      setTimeout(() => setStaffSuccess(false), 3000);
    } catch (err) {
      setStaffError(err.message || 'Failed to create staff account');
    }
  };

  // Delete Staff Account
  const handleDeleteStaff = async (id, email) => {
    if (window.confirm(`Are you sure you want to delete the staff account for ${email}?`)) {
      try {
        await deleteStaffAccount(id, currentUser?.email);
      } catch (err) {
        alert(err.message || 'Failed to delete staff account');
      }
    }
  };

  // Live Student Camera Logic
  const startStudentCamera = async () => {
    setUseStudentCamera(true);
    setStudentPhotoInput(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (studentVideoRef.current) {
        studentVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setStudentErrorMsg("Unable to access front-facing webcam.");
      setUseStudentCamera(false);
    }
  };

  const stopStudentCamera = () => {
    if (studentVideoRef.current && studentVideoRef.current.srcObject) {
      const stream = studentVideoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      studentVideoRef.current.srcObject = null;
    }
    setUseStudentCamera(false);
  };

  const captureStudentPhoto = () => {
    if (studentVideoRef.current && studentCanvasRef.current) {
      const video = studentVideoRef.current;
      const canvas = studentCanvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setStudentPhotoInput(dataUrl);
      stopStudentCamera();
    }
  };

  // Stop student camera if tab changes or component unmounts
  useEffect(() => {
    if (activeTab !== 'students') {
      stopStudentCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (studentVideoRef.current && studentVideoRef.current.srcObject) {
        const stream = studentVideoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Add Student Manually
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentErrorMsg('');
    setStudentSuccessMsg(false);

    if (!studentEnroll.trim() || !studentNameInput.trim()) {
      setStudentErrorMsg('Both Enrollment Number and Student Name are required');
      return;
    }

    try {
      stopStudentCamera();
      await addStudent({
        enrollmentNumber: studentEnroll.trim(),
        name: studentNameInput.trim(),
        photo: studentPhotoInput
      }, currentUser?.email);

      setStudentSuccessMsg(true);
      setStudentEnroll('');
      setStudentNameInput('');
      setStudentPhotoInput(null);
      setTimeout(() => setStudentSuccessMsg(false), 3000);
    } catch (err) {
      setStudentErrorMsg(err.message || 'Failed to add student');
    }
  };

  // Toggle Student Status
  const handleToggleStudentStatus = async (enrollmentNumber, name, currentStatus) => {
    try {
      await toggleStudentStatus(enrollmentNumber, currentUser?.email);
    } catch (err) {
      alert(err.message || 'Failed to update student status');
    }
  };

  // Delete Student Account
  const handleDeleteStudent = async (enrollmentNumber, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the student account for ${name} (${enrollmentNumber})?`)) {
      try {
        await deleteStudent(enrollmentNumber, currentUser?.email);
      } catch (err) {
        alert(err.message || 'Failed to delete student account');
      }
    }
  };

  // Bulk Student File Uploader parser
  const handleBulkFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkErrorMsg('');
    setBulkSuccessMsg('');
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Split by lines
        const lines = text.split(/\r?\n/);
        const parsedStudents = [];

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          // Skip headers
          if (line.toLowerCase().includes('enrollment') || line.toLowerCase().includes('student name') || line.toLowerCase().startsWith('id,name')) {
            continue;
          }

          // Split by comma or tab
          const columns = line.split(/,|\t/);
          if (columns.length >= 2) {
            const enroll = columns[0].trim();
            const name = columns[1].trim();
            let photo = '';
            
            if (columns.length >= 3) {
              const possibleLink = columns[2].trim();
              if (possibleLink.toLowerCase().startsWith('http://') || possibleLink.toLowerCase().startsWith('https://')) {
                photo = possibleLink;
              }
            }
            
            if (enroll && name) {
              parsedStudents.push({
                enrollmentNumber: enroll,
                name: name,
                photo: photo || undefined
              });
            }
          }
        }

        if (parsedStudents.length > 0) {
          await addStudentsBulk(parsedStudents, currentUser?.email);
          setBulkSuccessMsg(`Bulk upload successful! Processed ${parsedStudents.length} records.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setBulkErrorMsg('Error: No valid student rows found. Expected CSV format: EnrollmentNumber,StudentName');
        }
      } catch (err) {
        setBulkErrorMsg(err.message || 'File parsing error');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setBulkErrorMsg('Error reading file.');
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-campus-border/60 bg-campus-card rounded-t-lg no-print">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'inventory' 
              ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
              : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Package Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'students' 
              ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
              : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Student Directory ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'staff' 
              ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
              : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
          }`}
        >
          <ListOrdered className="h-4 w-4" />
          <span>Staff Accounts ({staffList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'logs' 
              ? 'border-campus-primary text-campus-primary bg-campus-primary/5' 
              : 'border-transparent text-campus-text-muted hover:text-campus-text-main'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* --- INVENTORY TAB --- */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="campus-panel p-4 bg-slate-900 border-campus-border/80 space-y-4 no-print">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-campus-text-muted font-bold border-b border-campus-border/40 pb-2">
              <Filter className="h-4 w-4" />
              <span>Search & Filter Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Keyword</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, ID, Tracking..."
                    className="w-full pl-8 pr-3 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-campus-text-muted" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                >
                  <option value="all">All Packages</option>
                  <option value="Received">Received (Awaiting)</option>
                  <option value="Collected">Collected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Carrier</label>
                <select
                  value={filterCarrier}
                  onChange={(e) => setFilterCarrier(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs capitalize focus:outline-none focus:border-campus-primary"
                >
                  {carriers.map(c => <option key={c} value={c}>{c === 'all' ? 'All Carriers' : c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Date Range (Inbound)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-[11px] focus:outline-none focus:border-campus-primary"
                  />
                  <span className="text-campus-text-muted self-center">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-[11px] focus:outline-none focus:border-campus-primary"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-campus-border/40 flex justify-between gap-3 flex-wrap">
              <span className="text-xs text-campus-text-muted self-center">
                Showing <strong className="text-campus-text-main">{filteredPackages.length}</strong> of <strong className="text-campus-text-main">{packages.length}</strong> packages
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded bg-campus-bg border border-campus-border hover:border-campus-success hover:text-campus-success text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel/CSV Report</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PDF Print</span>
                </button>
              </div>
            </div>
          </div>

          <div className="hidden print:block print-header text-center">
            <h1 className="text-4xl font-black uppercase tracking-widest text-black">NIIT UNIVERSITY</h1>
            <p className="text-xs font-mono text-gray-500 mt-2 uppercase tracking-widest font-semibold">The University of the Future</p>
            <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between text-xs font-mono text-gray-700">
              <span>REPORT: COURIER ROOM INVENTORY</span>
              <span>GENERATED: {new Date().toLocaleString()}</span>
              <span>TOTAL PACKAGES: {filteredPackages.length}</span>
            </div>
          </div>

          {/* Packages Table */}
          <div className="campus-panel overflow-hidden border-campus-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-campus-bg/75 border-b border-campus-border text-xs font-mono uppercase text-campus-text-muted">
                    <th className="px-4 py-3 font-semibold">Student & ID</th>
                    <th className="px-4 py-3 font-semibold">Carrier / Track No</th>
                    <th className="px-4 py-3 font-semibold">Rack Location</th>
                    <th className="px-4 py-3 font-semibold">Inbound Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold no-print">Receipt Photo</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-campus-border/60">
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-campus-text-muted italic">
                        No courier packages match selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map(pkg => (
                      <tr 
                        key={pkg.id} 
                        onClick={() => setSelectedPkg(pkg)}
                        className="hover:bg-campus-card-hover/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-campus-text-main">{pkg.studentName}</div>
                          <div className="text-[10px] font-mono text-campus-text-muted uppercase">{pkg.enrollmentNumber}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-campus-text-main font-semibold">{pkg.courierCompany}</div>
                          <div className="text-[10px] font-mono text-campus-text-muted">{pkg.trackingNumber || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold font-mono text-campus-accent bg-campus-accent/10 border border-campus-accent/30 px-2 py-0.5 rounded">
                            {pkg.shelfLocation}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-campus-text-muted">
                          {new Date(pkg.dateReceived).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            pkg.status === 'Collected'
                              ? 'bg-campus-success/10 border-campus-success/40 text-campus-success'
                              : 'bg-campus-accent/10 border-campus-accent/40 text-campus-accent animate-pulse-light'
                          }`}>
                            {pkg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 no-print">
                          {pkg.packageImage ? (
                            <img 
                              src={pkg.packageImage} 
                              alt="Thumbnail" 
                              className="h-9 w-12 rounded object-cover border border-campus-border"
                            />
                          ) : (
                            <span className="text-[10px] text-campus-text-muted italic">No image</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- STUDENT DIRECTORY TAB (NEW FEATURE) --- */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print animate-fade-in">
          
          {/* Add Student manually & Bulk CSV Uploader */}
          <div className="space-y-6">
            
            {/* Manual Form */}
            <div className="campus-panel p-5 bg-slate-900 border-campus-border/80 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-campus-text-muted font-bold border-b border-campus-border/40 pb-2">
                <UserPlus className="h-4.5 w-4.5 text-campus-accent" />
                <span>Register Student Manually</span>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="space-y-3 font-sans">
                {studentErrorMsg && (
                  <div className="p-2 rounded bg-campus-danger/10 border border-campus-danger/30 text-campus-danger text-xs">
                    {studentErrorMsg}
                  </div>
                )}

                {studentSuccessMsg && (
                  <div className="p-2 rounded bg-campus-success/10 border border-campus-success/30 text-campus-success text-xs flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>Student registered successfully!</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Enrollment Number</label>
                  <input
                    type="text"
                    required
                    value={studentEnroll}
                    onChange={(e) => setStudentEnroll(e.target.value)}
                    placeholder="e.g. BT/CSE/2023/045"
                    className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-accent font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-accent"
                  />
                </div>

                {/* Student profile photo (manual registration with live capture) */}
                <div className="space-y-2 font-sans">
                  <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Student Photo (Live Capture or Upload)</label>
                  
                  {useStudentCamera ? (
                    <div className="space-y-2">
                      <div className="relative border border-campus-accent/50 rounded-lg overflow-hidden bg-black aspect-video max-w-full">
                        <video 
                          ref={studentVideoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                        {/* Camera Overlay */}
                        <div className="absolute inset-0 border-2 border-campus-accent/20 pointer-events-none flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-campus-accent/40 animate-pulse"></div>
                        </div>
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-campus-accent uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-campus-accent animate-ping"></span>
                          <span>Student Cam Live</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={captureStudentPhoto}
                          className="flex-1 py-1 px-2.5 rounded bg-campus-accent hover:bg-campus-accent-hover text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Capture Frame</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopStudentCamera}
                          className="px-2.5 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-muted hover:text-campus-text-main text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <canvas ref={studentCanvasRef} className="hidden" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={startStudentCamera}
                        className="px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border hover:border-campus-accent text-campus-text-muted hover:text-campus-accent text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="h-3.5 w-3.5 text-campus-accent" />
                        <span>Live Capture</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => studentPhotoRef.current?.click()}
                        className="px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border hover:border-campus-accent text-campus-text-muted hover:text-campus-accent text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="h-3.5 w-3.5 text-campus-primary" />
                        <span>Upload File</span>
                      </button>

                      {studentPhotoInput && (
                        <div className="relative">
                          <img 
                            src={studentPhotoInput} 
                            alt="Preview avatar" 
                            className="h-8 w-8 rounded-full object-cover border border-campus-border"
                          />
                          <button
                            type="button"
                            onClick={() => setStudentPhotoInput(null)}
                            className="absolute -top-1 -right-1 p-0.5 bg-campus-danger text-white rounded-full hover:bg-red-600 shadow shadow-black cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={studentPhotoRef}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setStudentPhotoInput(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 mt-2 rounded bg-campus-accent hover:bg-campus-accent-hover text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register Student</span>
                </button>
              </form>
            </div>

            {/* Bulk File Uploader */}
            <div className="campus-panel p-5 bg-slate-900 border-campus-border/80 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-campus-text-muted font-bold border-b border-campus-border/40 pb-2">
                <FileUp className="h-4.5 w-4.5 text-campus-primary" />
                <span>Bulk Upload Student List</span>
              </div>

              <div className="space-y-3 font-sans">
                {bulkErrorMsg && (
                  <div className="p-2.5 rounded bg-campus-danger/10 border border-campus-danger/30 text-campus-danger text-xs">
                    {bulkErrorMsg}
                  </div>
                )}

                {bulkSuccessMsg && (
                  <div className="p-2.5 rounded bg-campus-success/10 border border-campus-success/30 text-campus-success text-xs flex items-start gap-1.5">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bulkSuccessMsg}</span>
                  </div>
                )}

                <p className="text-[11px] text-campus-text-muted leading-relaxed">
                  Upload a <strong>CSV</strong> or <strong>TXT</strong> file containing a list of student accounts. Formatting must represent: 
                  <code className="block mt-1 p-1 bg-black/50 text-[10px] rounded text-campus-accent font-mono">
                    EnrollmentNumber, StudentName, [PhotoURL/GooglePhotosLink]
                  </code>
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-campus-border hover:border-campus-primary rounded-lg p-6 text-center cursor-pointer hover:bg-campus-card-hover/20 transition-all"
                >
                  <Upload className="h-8 w-8 text-campus-text-muted mx-auto mb-2 animate-pulse-light" />
                  <span className="block text-xs font-bold text-campus-text-main">
                    {isUploading ? 'Uploading & parsing...' : 'Select CSV/Text File'}
                  </span>
                  <span className="block text-[10px] text-campus-text-muted mt-1">
                    Drag and drop file here
                  </span>
                </div>

                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                  onChange={handleBulkFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

          </div>

          {/* Student List View */}
          <div className="campus-panel p-5 bg-campus-card border-campus-border lg:col-span-2 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-campus-border/60 pb-2">
              <span className="text-xs font-mono uppercase text-campus-text-muted font-bold">
                Registered Campus Students
              </span>
              
              <div className="relative w-full sm:max-w-[200px]">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter student list..."
                  className="w-full pl-7 pr-2 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-[11px] focus:outline-none focus:border-campus-primary"
                />
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-campus-text-muted" />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[440px] pr-1 space-y-2">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-xs text-campus-text-muted italic py-8">
                  No registered students found matching keyword.
                </p>
              ) : (
                filteredStudents.map((stud, index) => (
                  <div 
                    key={stud.enrollmentNumber + index}
                    className="p-3 bg-campus-bg border border-campus-border rounded flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {stud.photo ? (
                        <div className="relative shrink-0">
                          <img 
                            src={stud.photo} 
                            alt="Student profile photo" 
                            className="h-10 w-10 rounded-full object-cover border border-campus-border"
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
                            className="h-10 w-10 rounded-full bg-campus-primary/10 border border-campus-primary/30 flex items-center justify-center text-[10px] font-mono text-campus-primary shrink-0"
                          >
                            {stud.name ? stud.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-campus-primary/10 border border-campus-primary/30 flex items-center justify-center text-[10px] font-mono text-campus-primary shrink-0">
                          {stud.name ? stud.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-xs text-campus-text-main">{stud.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-campus-text-muted">
                            Enrollment: <strong className="text-slate-300 font-semibold">{stud.enrollmentNumber}</strong>
                          </span>
                          {stud.photo && (stud.photo.startsWith('http://') || stud.photo.startsWith('https://')) && (
                            <a 
                              href={stud.photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[9px] font-mono text-campus-accent hover:underline flex items-center gap-0.5 bg-campus-accent/5 px-1.5 py-0.2 rounded border border-campus-accent/20 cursor-pointer"
                              title="Open student photo page (e.g. Google Photos)"
                            >
                              <ExternalLink className="h-2 w-2" />
                              <span>Photo Link</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStudentStatus(stud.enrollmentNumber, stud.name, stud.status)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border cursor-pointer transition-colors ${
                          stud.status === 'inactive'
                            ? 'bg-campus-danger/10 border-campus-danger/30 text-campus-danger hover:bg-campus-danger/20 animate-pulse-light'
                            : 'bg-campus-success/10 border-campus-success/30 text-campus-success hover:bg-campus-danger/10 hover:text-campus-danger hover:border-campus-danger/30'
                        }`}
                        title={stud.status === 'inactive' ? 'Activate Student Account' : 'Deactivate Student Account'}
                      >
                        {stud.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteStudent(stud.enrollmentNumber, stud.name)}
                        className="p-1 rounded hover:bg-campus-danger/10 hover:text-campus-danger border border-transparent hover:border-campus-danger/30 text-campus-text-muted cursor-pointer transition-all"
                        title="Delete Student Profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* --- STAFF ACCOUNTS TAB --- */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          <div className="campus-panel p-5 bg-slate-900 border-campus-border/80 h-fit space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-campus-text-muted font-bold border-b border-campus-border/40 pb-2">
              <UserPlus className="h-4.5 w-4.5 text-campus-primary" />
              <span>Create Staff Account</span>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              {staffError && (
                <div className="p-2 rounded bg-campus-danger/10 border border-campus-danger/30 text-campus-danger text-xs">
                  {staffError}
                </div>
              )}

              {staffSuccess && (
                <div className="p-2 rounded bg-campus-success/10 border border-campus-success/30 text-campus-success text-xs flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Staff account added successfully!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. sarah@university.edu"
                  className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-campus-text-muted uppercase">Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary font-mono"
                >
                  <option value="staff">Staff (Intake & Handover)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 mt-2 rounded bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Save Staff Account</span>
              </button>
            </form>
          </div>

          <div className="campus-panel p-5 bg-campus-card border-campus-border lg:col-span-2 space-y-4">
            <div className="text-xs font-mono uppercase text-campus-text-muted font-bold border-b border-campus-border/60 pb-2">
              <span>Active Courier Staff Directory</span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {staffList.map((staff) => (
                <div 
                  key={staff.id} 
                  className="p-3 bg-campus-bg border border-campus-border rounded flex items-center justify-between gap-3 hover:border-campus-border/90"
                >
                  <div>
                    <div className="font-bold text-xs text-campus-text-main flex items-center gap-2">
                      <span>{staff.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        staff.role === 'admin' 
                          ? 'bg-purple-950/45 text-purple-400 border border-purple-800' 
                          : 'bg-campus-primary/10 text-campus-primary border border-campus-primary/30'
                      }`}>
                        {staff.role}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-campus-text-muted mt-0.5">{staff.email}</div>
                  </div>

                  {currentUser?.email.toLowerCase() !== staff.email.toLowerCase() && !staff.id.startsWith('admin-') ? (
                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.email)}
                      className="p-1.5 rounded hover:bg-campus-danger/10 hover:text-campus-danger border border-transparent hover:border-campus-danger/30 text-campus-text-muted cursor-pointer transition-all"
                      title="Remove Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-campus-text-muted italic font-mono px-2">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- AUDIT LOGS TAB --- */}
      {activeTab === 'logs' && (
        <div className="campus-panel p-5 bg-campus-card border-campus-border space-y-4 no-print">
          <div className="flex items-center justify-between border-b border-campus-border/60 pb-2">
            <span className="text-xs font-mono uppercase text-campus-text-muted font-bold">
              Courier Hub Activity Logs (Real-time Audit Trail)
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-2.5 rounded bg-campus-bg/50 border border-campus-border/40 hover:border-campus-border/60 text-xs flex items-start gap-3 transition-colors"
              >
                <div className="text-campus-primary shrink-0 pt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-campus-primary animate-pulse"></span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-campus-text-main font-medium leading-tight">
                    {log.details}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-campus-text-muted font-mono">
                    <span>Actor: <strong className="text-slate-300 font-semibold">{log.user}</strong></span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- INVENTORY DETAIL MODAL --- */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-campus-card border border-campus-border max-w-lg w-full rounded-lg shadow-2xl p-5 space-y-4">
            
            <div className="flex justify-between items-center border-b border-campus-border/60 pb-2.5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-campus-text-main">
                Package Receipt Record
              </h4>
              <button 
                onClick={() => setSelectedPkg(null)}
                className="text-campus-text-muted hover:text-campus-text-main cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Student Name</span>
                <span className="font-bold text-campus-text-main">{selectedPkg.studentName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Enrollment Number</span>
                <span className="font-bold font-mono text-campus-text-main">{selectedPkg.enrollmentNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Carrier & Tracking</span>
                <span className="font-semibold text-campus-text-main">{selectedPkg.courierCompany}</span>
                <span className="block font-mono text-campus-text-muted text-[10px]">{selectedPkg.trackingNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Shelf Storage</span>
                <span className="font-bold font-mono text-campus-accent text-sm">{selectedPkg.shelfLocation}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  selectedPkg.status === 'Collected' 
                    ? 'bg-campus-success/15 border-campus-success/35 text-campus-success' 
                    : 'bg-campus-accent/15 border-campus-accent/35 text-campus-accent'
                }`}>
                  {selectedPkg.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Checked In By</span>
                <span className="text-campus-text-main">{selectedPkg.receivedBy || 'Staff'}</span>
                <span className="block text-[9px] font-mono text-campus-text-muted">{new Date(selectedPkg.dateReceived).toLocaleString()}</span>
              </div>

              {selectedPkg.status === 'Collected' && (
                <div className="col-span-2 border-t border-campus-border/60 pt-3 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Collection Date</span>
                    <span className="text-campus-text-main font-mono">{new Date(selectedPkg.collectionDate).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Verified By</span>
                    <span className="text-campus-text-main font-bold">{selectedPkg.verifiedBy}</span>
                  </div>
                </div>
              )}

              {selectedPkg.packageDescription && (
                <div className="col-span-2 border-t border-campus-border/60 pt-2.5">
                  <span className="block text-[10px] font-mono text-campus-text-muted uppercase">Description</span>
                  <p className="text-campus-text-muted italic">{selectedPkg.packageDescription}</p>
                </div>
              )}
            </div>

            {selectedPkg.packageImage && (
              <div className="border border-campus-border rounded overflow-hidden">
                <span className="block text-[9px] font-mono text-campus-text-muted uppercase px-2 py-1 bg-campus-bg/75 border-b border-campus-border">
                  Intake Barcode / Slip Photo
                </span>
                <img 
                  src={selectedPkg.packageImage} 
                  alt="Invoice or package" 
                  className="w-full max-h-48 object-contain bg-black"
                />
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-campus-border/60">
              <button
                onClick={() => setSelectedPkg(null)}
                className="px-4 py-1.5 rounded bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

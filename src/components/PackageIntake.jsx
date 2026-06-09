import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Send, RefreshCw, X, Box, CheckCircle, Barcode, Scan, UserCheck, HelpCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { addPackage, addStudent } from '../db';

const COURIERS = ['Amazon Logistics', 'Blue Dart', 'DHL Express', 'FedEx', 'UPS', 'USPS', 'DTDC', 'Other'];
const RACKS = ['RACK A', 'RACK B', 'RACK C', 'RACK D', 'RACK E'];
const SHELVES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];

export default function PackageIntake({ prefilledTracking, onComplete, currentUser, students = [], packages = [] }) {
  const [studentName, setStudentName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(prefilledTracking || '');
  const [courierCompany, setCourierCompany] = useState(COURIERS[0]);
  const [otherCourier, setOtherCourier] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [rack, setRack] = useState(RACKS[0]);
  const [shelf, setShelf] = useState(SHELVES[0]);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [useCamera, setUseCamera] = useState(false);

  // Barcode Scanner Simulator State
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isStudentAutofilled, setIsStudentAutofilled] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [isStudentInactive, setIsStudentInactive] = useState(false);

  const videoRef = useRef(null);
  const barcodeVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Update tracking number if prefilled value changes
  useEffect(() => {
    if (prefilledTracking) {
      setTrackingNumber(prefilledTracking);
      autoDetectCourier(prefilledTracking);
    }
  }, [prefilledTracking]);

  // Autofill student name and photo when enrollment number matches registered students
  useEffect(() => {
    const cleanEnroll = enrollmentNumber.trim().toUpperCase();
    if (cleanEnroll) {
      const match = students.find(s => s.enrollmentNumber.toUpperCase() === cleanEnroll);
      if (match) {
        setStudentName(match.name);
        setStudentPhoto(match.photo || null);
        setIsStudentAutofilled(true);
        setIsStudentInactive(match.status === 'inactive');
      } else {
        // If it was autofilled but is now modified to a non-matching string, clear name
        if (isStudentAutofilled) {
          setStudentName('');
          setStudentPhoto(null);
          setIsStudentAutofilled(false);
          setIsStudentInactive(false);
        }
      }
    } else {
      setStudentName('');
      setStudentPhoto(null);
      setIsStudentAutofilled(false);
      setIsStudentInactive(false);
    }
  }, [enrollmentNumber, students]);

  // Auto-allocate shelf to first EMPTY (unoccupied) location, starting at enrollment hash preference
  useEffect(() => {
    if (enrollmentNumber) {
      let hash = 0;
      for (let i = 0; i < enrollmentNumber.length; i++) {
        hash = enrollmentNumber.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Identify currently occupied shelf locations (status = 'Received')
      const occupiedShelves = new Set(
        packages
          .filter(p => p.status === 'Received')
          .map(p => p.shelfLocation)
      );

      // Start search indexes from the hash preference
      const preferredRackIdx = Math.abs(hash) % RACKS.length;
      const preferredShelfIdx = Math.abs(hash >> 2) % SHELVES.length;

      let foundRack = RACKS[preferredRackIdx];
      let foundShelf = SHELVES[preferredShelfIdx];
      let found = false;

      // 1. Check if the preferred hashed location is empty
      if (!occupiedShelves.has(`${foundRack}-${foundShelf}`)) {
        found = true;
      }

      // 2. If occupied, search systematically for the first empty shelf
      if (!found) {
        for (let rOffset = 0; rOffset < RACKS.length && !found; rOffset++) {
          const rIdx = (preferredRackIdx + rOffset) % RACKS.length;
          const currentRack = RACKS[rIdx];

          for (let sOffset = 0; sOffset < SHELVES.length && !found; sOffset++) {
            const sIdx = (preferredShelfIdx + sOffset) % SHELVES.length;
            const currentShelf = SHELVES[sIdx];
            
            const candidateLoc = `${currentRack}-${currentShelf}`;
            if (!occupiedShelves.has(candidateLoc)) {
              foundRack = currentRack;
              foundShelf = currentShelf;
              found = true;
            }
          }
        }
      }

      setRack(foundRack);
      setShelf(foundShelf);
    }
  }, [enrollmentNumber, packages]);

  // Helper to autodetect courier
  const autoDetectCourier = (trackingStr) => {
    const lower = trackingStr.toLowerCase();
    if (lower.startsWith('dhl')) setCourierCompany('DHL Express');
    else if (lower.startsWith('fdx') || lower.startsWith('fed')) setCourierCompany('FedEx');
    else if (lower.startsWith('amz') || lower.startsWith('ama')) setCourierCompany('Amazon Logistics');
    else if (lower.startsWith('bd')) setCourierCompany('Blue Dart');
    else if (lower.startsWith('1z') || lower.startsWith('ups')) setCourierCompany('UPS');
    else if (lower.startsWith('usp')) setCourierCompany('USPS');
    else if (lower.startsWith('dtd')) setCourierCompany('DTDC');
  };

  // Synthesize dynamic beep tone
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1350; // high frequency crisp beep
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.03);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.12);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Web Audio Context not allowed/failed:", e);
    }
  };

  // Barcode Scanner Simulator Engine
  const startBarcodeScanner = async () => {
    setIsScanningBarcode(true);
    setErrorMsg('');
    
    // Attempt camera start for scanner background
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.log("Scanner running in simulated camera mode:", err);
    }

    // Trigger scanning timeout to simulate barcode lock
    setTimeout(() => {
      stopBarcodeScannerStream();
      playScanBeep();
      
      // Generate random courier scan tracking number
      const mockCarriers = ['DHL', 'FDX', 'AMZ', 'UPS', 'BD'];
      const carrier = mockCarriers[Math.floor(Math.random() * mockCarriers.length)];
      let mockTracking = '';
      if (carrier === 'AMZ') mockTracking = 'AMZ' + Math.floor(10000000 + Math.random() * 90000000);
      else if (carrier === 'DHL') mockTracking = 'DHL' + Math.floor(1000000 + Math.random() * 9000000);
      else if (carrier === 'FDX') mockTracking = 'FDX' + Math.floor(100000000 + Math.random() * 900000000);
      else if (carrier === 'UPS') mockTracking = '1Z' + Math.floor(1000000000000000 + Math.random() * 9000000000000000);
      else mockTracking = 'BD' + Math.floor(10000000 + Math.random() * 90000000);

      setTrackingNumber(mockTracking);
      autoDetectCourier(mockTracking);
      setIsScanningBarcode(false);
    }, 1800);
  };

  const stopBarcodeScannerStream = () => {
    if (barcodeVideoRef.current && barcodeVideoRef.current.srcObject) {
      const stream = barcodeVideoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      barcodeVideoRef.current.srcObject = null;
    }
  };

  const cancelBarcodeScanner = () => {
    stopBarcodeScannerStream();
    setIsScanningBarcode(false);
  };

  // Camera logic (Photo Capture)
  const startCamera = async () => {
    setUseCamera(true);
    setImagePreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Unable to access camera. Please upload file instead.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  // File Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate Canvas stylized package receipt if no photo taken
  const generateMockReceipt = (enroll, name, courierStr) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 250);
    
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, 390, 240);
    
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 16px monospace';
    ctx.fillText("CAMPUSPOST INTAKE RECEIPT", 20, 35);
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 45);
    ctx.lineTo(380, 45);
    ctx.stroke();
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText("STUDENT NAME:", 20, 70);
    ctx.fillText("ENROLLMENT NO:", 20, 95);
    ctx.fillText("CARRIER:", 20, 120);
    ctx.fillText("DATE RECEIVED:", 20, 145);
    ctx.fillText("LOCATION:", 20, 170);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(name.toUpperCase(), 130, 70);
    ctx.font = 'bold 12px monospace';
    ctx.fillText(enroll.toUpperCase(), 130, 95);
    ctx.font = '12px sans-serif';
    ctx.fillText(courierStr, 130, 120);
    ctx.font = '11px monospace';
    ctx.fillText(new Date().toLocaleString(), 130, 145);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${rack}-${shelf}`, 130, 170);

    // Barcode mock
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 195, 360, 35);
    ctx.fillStyle = '#000000';
    let currX = 30;
    while (currX < 370) {
      const width = Math.floor(Math.random() * 4) + 1;
      const space = Math.floor(Math.random() * 5) + 2;
      ctx.fillRect(currX, 200, width, 25);
      currX += width + space;
    }
    
    return canvas.toDataURL('image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!studentName.trim()) {
      setErrorMsg("Student Name is required");
      return;
    }
    if (!enrollmentNumber.trim()) {
      setErrorMsg("Enrollment Number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCourier = courierCompany === 'Other' ? otherCourier : courierCompany;
      const finalShelfLoc = `${rack}-${shelf}`;
      const finalPhoto = imagePreview || generateMockReceipt(enrollmentNumber, studentName, finalCourier);

      const newPkgData = {
        studentName: studentName.trim(),
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
        courierCompany: finalCourier || 'Unknown',
        trackingNumber: trackingNumber.trim() || 'N/A',
        packageDescription: packageDescription.trim() || 'General Package',
        shelfLocation: finalShelfLoc,
        packageImage: finalPhoto
      };

      await addPackage(newPkgData, currentUser?.email);

      // Register the student if they don't already exist in the system
      const cleanEnroll = enrollmentNumber.trim().toUpperCase();
      const match = students.find(s => s.enrollmentNumber.toUpperCase() === cleanEnroll);
      if (!match) {
        await addStudent({
          enrollmentNumber: cleanEnroll,
          name: studentName.trim(),
          photo: null
        }, currentUser?.email);
      }

      setSuccessMsg(true);
      setStudentName('');
      setEnrollmentNumber('');
      setTrackingNumber('');
      setPackageDescription('');
      setImagePreview(null);
      setIsStudentAutofilled(false);
      
      setTimeout(() => {
        setSuccessMsg(false);
        if (onComplete) onComplete();
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to catalog package.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="campus-panel p-5 bg-campus-card border-campus-border no-print">
      
      <div className="flex items-center justify-between mb-4 border-b border-campus-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-campus-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-campus-text-main">
            Courier Intake Workspace
          </h3>
        </div>
        
        {/* Toggle Simulated Scanner */}
        <button
          type="button"
          onClick={startBarcodeScanner}
          className="px-2.5 py-1 rounded border border-campus-accent bg-campus-accent/10 hover:bg-campus-accent hover:text-slate-950 text-campus-accent text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
        >
          <Scan className="h-3.5 w-3.5" />
          <span>Simulate Barcode Scan</span>
        </button>
      </div>

      {/* BARCODE SCANNER MODAL WINDOW */}
      {isScanningBarcode && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-campus-card border border-campus-accent/40 max-w-md w-full rounded-lg shadow-2xl p-6 relative overflow-hidden scan-indicator">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-campus-accent/5 rounded-full blur-xl"></div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-campus-accent/15 border border-campus-accent/30 text-campus-accent animate-pulse">
                <Barcode className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase text-campus-text-main tracking-wider">
                  Align Courier Barcode
                </h4>
                <p className="text-[11px] text-campus-text-muted mt-1">
                  Position tracking label inside the scanner viewport...
                </p>
              </div>

              {/* Laser viewport */}
              <div className="relative border border-campus-border bg-slate-950 h-44 rounded overflow-hidden flex items-center justify-center">
                <video 
                  ref={barcodeVideoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 bg-black"
                />
                
                {/* Laser scanning visual line */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-campus-accent/80 shadow-[0_0_12px_2px_rgba(245,158,11,0.8)] animate-pulse"></div>
                <div className="border-2 border-dashed border-campus-accent/40 w-44 h-16 rounded opacity-80 z-10 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-campus-accent uppercase font-bold tracking-widest bg-slate-950/80 px-2 py-0.5 rounded">
                    ALIGN CODE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={cancelBarcodeScanner}
                className="px-4 py-1.5 bg-slate-900 border border-campus-border hover:border-campus-danger hover:text-campus-danger text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel Scan
              </button>
            </div>

          </div>
        </div>
      )}

      {successMsg ? (
        <div className="py-8 text-center space-y-3 animate-fade-in">
          <div className="inline-flex p-3 rounded-full bg-campus-success/10 text-campus-success border border-campus-success/30">
            <CheckCircle className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-base font-bold text-campus-success">Inbound Logged Successfully</h4>
          <p className="text-xs text-campus-text-muted">Package has been saved and shelf allocated.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          
          {errorMsg && (
            <div className="p-2.5 rounded bg-campus-danger/10 border border-campus-danger/30 text-campus-danger text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Enrollment Number first to trigger autocomplete lookup */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Enrollment Number *</label>
              <input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="e.g. BT/CSE/2023/045"
                className="w-full px-3 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary font-mono"
              />
              <p className="text-[9px] text-campus-text-muted">
                Type enrollment ID to query details from the student database automatically.
              </p>
            </div>

            {/* Student Name (Autofills and Locks) */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Student Name *</label>
                {isStudentAutofilled ? (
                  <span className="text-[9px] font-bold text-campus-success flex items-center gap-0.5">
                    <UserCheck className="h-3 w-3" /> Verified Directory Student
                  </span>
                ) : enrollmentNumber.trim() !== '' ? (
                  <span className="text-[9px] font-bold text-campus-accent flex items-center gap-0.5">
                    <HelpCircle className="h-3 w-3" /> New Student (Auto-Registered)
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={isStudentAutofilled}
                  placeholder={isStudentAutofilled ? "Autofilled from directory" : "e.g. Aarav Sharma"}
                  className={`w-full px-3 py-1.5 rounded border text-xs focus:outline-none focus:border-campus-primary ${
                    isStudentAutofilled 
                      ? 'bg-campus-bg/40 border-campus-success/40 text-campus-success font-bold cursor-not-allowed'
                      : 'bg-campus-bg border-campus-border text-campus-text-main'
                  }`}
                />
                {isStudentAutofilled && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudentAutofilled(false);
                      setStudentName('');
                      setStudentPhoto(null);
                    }}
                    className="absolute right-2.5 top-1.5 text-[9px] text-campus-accent hover:underline font-bold"
                  >
                    Modify Name
                  </button>
                )}
              </div>
              {isStudentAutofilled && studentPhoto && (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 mt-2 p-2 bg-slate-900 border rounded animate-fade-in font-sans ${
                    isStudentInactive 
                      ? 'border-campus-danger/40 shadow-inner' 
                      : 'border-campus-success/35'
                  }`}>
                    <div className="relative shrink-0">
                      <img 
                        src={studentPhoto} 
                        alt="Student profile avatar" 
                        className={`h-10 w-10 rounded object-cover border ${
                          isStudentInactive ? 'border-campus-danger/40 grayscale' : 'border-campus-success/40'
                        }`}
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
                        className="h-10 w-10 rounded bg-campus-primary/10 border border-campus-primary/30 flex items-center justify-center text-[10px] font-mono text-campus-primary"
                      >
                        {studentName ? studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase block px-1 rounded ${
                          isStudentInactive 
                            ? 'bg-campus-danger/25 text-campus-danger border border-campus-danger/45' 
                            : 'bg-campus-success/10 text-campus-success'
                        }`}>
                          {isStudentInactive ? 'Account Deactivated' : 'Verified Campus Profile'}
                        </span>
                        {studentPhoto.startsWith('http') && (
                          <a 
                            href={studentPhoto} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[8px] font-mono text-campus-accent hover:underline flex items-center gap-0.5 bg-campus-accent/5 px-1.5 py-0.2 rounded border border-campus-accent/20 cursor-pointer"
                            title="Open photo link"
                          >
                            <ExternalLink className="h-2 w-2" />
                            <span>Link</span>
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-campus-text-main font-semibold leading-none mt-1 block">{studentName}</span>
                    </div>
                  </div>
                  
                  {isStudentInactive && (
                    <div className="p-2 rounded bg-campus-danger/10 border border-campus-danger/25 text-campus-danger text-[11px] flex items-start gap-1.5 font-sans leading-normal">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Warning: This student's account is deactivated. Package will be stored, but they will not receive notification alerts.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Courier Tracking */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Tracking Number (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    autoDetectCourier(e.target.value);
                  }}
                  placeholder="e.g. DHL987654"
                  className="flex-1 px-3 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary font-mono"
                />
                <button
                  type="button"
                  onClick={startBarcodeScanner}
                  title="Scan Barcode"
                  className="px-2.5 rounded bg-campus-bg border border-campus-border hover:border-campus-accent text-campus-text-muted hover:text-campus-accent cursor-pointer flex items-center justify-center"
                >
                  <Barcode className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Courier Company */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Courier Company</label>
              <div className="grid grid-cols-1 gap-2">
                <select
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                >
                  {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {courierCompany === 'Other' && (
                  <input
                    type="text"
                    required
                    value={otherCourier}
                    onChange={(e) => setOtherCourier(e.target.value)}
                    placeholder="Enter carrier name"
                    className="w-full px-3 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary"
                  />
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Shelf Allocation */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Shelf Allocation</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-campus-text-muted uppercase">Rack</label>
                  <select
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs font-bold font-mono focus:outline-none focus:border-campus-primary"
                  >
                    {RACKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-campus-text-muted uppercase">Shelf</label>
                  <select
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs font-bold font-mono focus:outline-none focus:border-campus-primary"
                  >
                    {SHELVES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-campus-text-muted">
                Allocated location: <span className="font-bold text-campus-accent font-mono">{rack}-{shelf}</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Package Description (Optional)</label>
              <textarea
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="e.g. Cardboard box, bubble wrapped package, heavy box"
                rows="2"
                className="w-full px-3 py-1.5 rounded bg-campus-bg border border-campus-border text-campus-text-main text-xs focus:outline-none focus:border-campus-primary resize-none"
              />
            </div>

          </div>

          {/* Photo upload / Camera */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono text-campus-text-muted uppercase">Package/Invoice Photo (Optional)</label>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={useCamera ? stopCamera : startCamera}
                className="px-3 py-1.5 rounded bg-campus-bg border border-campus-border hover:border-campus-primary hover:text-campus-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{useCamera ? 'Stop Camera' : 'Use Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded bg-campus-bg border border-campus-border hover:border-campus-primary hover:text-campus-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </button>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Camera Viewport */}
            {useCamera && (
              <div className="relative rounded overflow-hidden border border-campus-primary max-w-sm">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-auto bg-black"
                />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-campus-primary text-white text-xs font-bold rounded-lg shadow-lg hover:bg-campus-primary-hover flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Capture Photo</span>
                </button>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block border border-campus-border rounded p-1">
                <img 
                  src={imagePreview} 
                  alt="Package preview" 
                  className="max-h-36 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    stopCamera();
                  }}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-campus-danger text-white rounded-full hover:bg-red-600 shadow-lg cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {!imagePreview && !useCamera && (
              <p className="text-[10px] text-campus-text-muted italic">
                * Note: If no photo is selected, the system will auto-generate a digital package receipt with barcode.
              </p>
            )}

          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Form Actions */}
          <div className="pt-2 border-t border-campus-border/60 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStudentName('');
                setEnrollmentNumber('');
                setTrackingNumber('');
                setPackageDescription('');
                setImagePreview(null);
                setErrorMsg('');
                setIsStudentAutofilled(false);
                stopCamera();
              }}
              className="px-4 py-2 rounded bg-campus-bg border border-campus-border hover:border-campus-text-main text-xs font-bold cursor-pointer transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Log Package Inbound</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}

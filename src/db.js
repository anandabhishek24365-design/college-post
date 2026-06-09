import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Check if Firebase configuration is available
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

let app;
let firestore;
let isFirebaseActive = false;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(app);
    isFirebaseActive = true;
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
    isFirebaseActive = false;
  }
} else {
  console.log("No Firebase config found. Running in LocalStorage offline fallback mode.");
}

export { isFirebaseActive, firestore };

// --- LOCAL STORAGE MOCK ENGINE ---
const MOCK_PACKAGES_KEY = 'campus_courier_packages';
const MOCK_LOGS_KEY = 'campus_courier_logs';
const MOCK_STAFF_KEY = 'campus_courier_staff';
const MOCK_STUDENTS_KEY = 'campus_courier_students';

export const generateInitialsAvatar = (name) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#6366f1', '#06b6d4', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const color = colors[Math.abs(hash) % colors.length];
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 150, 150);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const initials = name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
      
    ctx.fillText(initials, 75, 75);
    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
};

const DEFAULT_STUDENTS = [
  { enrollmentNumber: 'BT/CSE/2023/045', name: 'Aarav Sharma', status: 'active' },
  { enrollmentNumber: 'BT/ECE/2022/102', name: 'Aditi Verma', status: 'active' },
  { enrollmentNumber: 'BT/ME/2024/012', name: 'Rohan Gupta', status: 'active' },
  { enrollmentNumber: 'BT/CSE/2023/089', name: 'Priya Patel', status: 'active' },
  { enrollmentNumber: 'BT25GAD308', name: 'ANKITA PATEL', status: 'active' },
  { enrollmentNumber: 'BT25GCS513', name: 'HARSH KATHIRIYA', status: 'active' },
  { enrollmentNumber: 'BT25GCS531', name: 'SANSKAR PATHAK', status: 'active' },
  { enrollmentNumber: 'BT25GCS515', name: 'TANISHKA SAGAR', status: 'active' },
  { enrollmentNumber: 'BT25GCS322', name: 'TANVI GUPTA', status: 'active' }
];

const DEFAULT_STAFF = [
  { id: 'admin-1', email: 'admin@campus.edu', password: 'admin123', name: 'Admin Principal', role: 'admin', active: true },
  { id: 'staff-1', email: 'staff1@campus.edu', password: 'staff123', name: 'Sarah Connor', role: 'staff', active: true },
  { id: 'staff-2', email: 'staff2@campus.edu', password: 'staff234', name: 'James Miller', role: 'staff', active: true }
];

const DEFAULT_PACKAGES = [
  {
    id: 'pkg-1',
    studentName: 'Aarav Sharma',
    enrollmentNumber: 'BT/CSE/2023/045',
    courierCompany: 'DHL Express',
    trackingNumber: 'DHL987654321',
    packageDescription: 'Dell Laptop Charger (Black)',
    shelfLocation: 'RACK B-14',
    dateReceived: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    status: 'Received',
    receivedBy: 'Sarah Connor',
    collectionDate: null,
    verifiedBy: null,
    packageImage: null
  },
  {
    id: 'pkg-2',
    studentName: 'Aditi Verma',
    enrollmentNumber: 'BT/ECE/2022/102',
    courierCompany: 'FedEx',
    trackingNumber: 'FDX456123789',
    packageDescription: 'Textbooks (Hardcover)',
    shelfLocation: 'RACK A-04',
    dateReceived: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    status: 'Received',
    receivedBy: 'James Miller',
    collectionDate: null,
    verifiedBy: null,
    packageImage: null
  },
  {
    id: 'pkg-3',
    studentName: 'Rohan Gupta',
    enrollmentNumber: 'BT/ME/2024/012',
    courierCompany: 'Blue Dart',
    trackingNumber: 'BD77889900',
    packageDescription: 'Sports Shoes (Nike Box)',
    shelfLocation: 'RACK D-02',
    dateReceived: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    status: 'Collected',
    receivedBy: 'Sarah Connor',
    collectionDate: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
    verifiedBy: 'Sarah Connor',
    packageImage: null
  },
  {
    id: 'pkg-4',
    studentName: 'Priya Patel',
    enrollmentNumber: 'BT/CSE/2023/089',
    courierCompany: 'Amazon Logistics',
    trackingNumber: 'AMZ55443322',
    packageDescription: 'Electronics & Keyboard',
    shelfLocation: 'RACK B-12',
    dateReceived: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    status: 'Collected',
    receivedBy: 'James Miller',
    collectionDate: new Date(Date.now() - 3600000 * 40).toISOString(),
    verifiedBy: 'James Miller',
    packageImage: null
  }
];

const DEFAULT_LOGS = [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 50).toISOString(), details: 'System database initialized in LocalStorage mode.', user: 'System' },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), details: 'Package pkg-2 received and cataloged at RACK A-04.', user: 'staff2@campus.edu' },
  { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), details: 'Package pkg-1 received and cataloged at RACK B-14.', user: 'staff1@campus.edu' },
  { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), details: 'Package pkg-3 collected by student Aarav Sharma, verified with University ID Card.', user: 'staff1@campus.edu' }
];

// Initialize storage helper
const getStoredData = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultVal;
  }
};

const writeStoredData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Seed Local Storage
getStoredData(MOCK_STAFF_KEY, DEFAULT_STAFF);
getStoredData(MOCK_PACKAGES_KEY, DEFAULT_PACKAGES);
getStoredData(MOCK_LOGS_KEY, DEFAULT_LOGS);

// Seed students with dynamic avatars and merge new defaults
const studentsInStorage = localStorage.getItem(MOCK_STUDENTS_KEY);
let currentStudents = [];
if (studentsInStorage) {
  try {
    currentStudents = JSON.parse(studentsInStorage);
  } catch (e) {
    currentStudents = [];
  }
}

let updatedStorageNeeded = !studentsInStorage;
const seededStudents = [...currentStudents];

// Update existing students in local storage who have empty/missing photos
seededStudents.forEach(s => {
  if (!s.photo) {
    s.photo = generateInitialsAvatar(s.name);
    updatedStorageNeeded = true;
  }
});

DEFAULT_STUDENTS.forEach(defStudent => {
  const exists = seededStudents.some(s => s.enrollmentNumber.toUpperCase() === defStudent.enrollmentNumber.toUpperCase());
  if (!exists) {
    seededStudents.push({
      ...defStudent,
      photo: defStudent.photo || generateInitialsAvatar(defStudent.name)
    });
    updatedStorageNeeded = true;
  }
});

if (updatedStorageNeeded) {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(seededStudents));
}

// Cloud Firestore Automated Database Seeder
const checkAndSeedDatabase = async () => {
  if (!isFirebaseActive) return;
  try {
    console.log("Checking and updating Cloud Firestore database collections...");
    
    // 1. Seed/Update Students
    for (const s of DEFAULT_STUDENTS) {
      const cleanEnroll = s.enrollmentNumber.trim().toUpperCase();
      const docId = cleanEnroll.replace(/\//g, '_');
      const docRef = doc(firestore, 'students', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          enrollmentNumber: cleanEnroll,
          name: s.name,
          photo: generateInitialsAvatar(s.name),
          status: s.status || 'active'
        });
      } else {
        // Update photo if it's currently empty or missing
        const data = docSnap.data();
        if (!data.photo) {
          await updateDoc(docRef, {
            photo: generateInitialsAvatar(s.name)
          });
        }
      }
    }
    
    // 2. Seed/Update Staff Accounts
    for (const st of DEFAULT_STAFF) {
      const docId = st.email.replace(/\./g, '_');
      const docRef = doc(firestore, 'staff', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: st.email,
          name: st.name,
          role: st.role,
          active: st.active
        });
      }
    }
    
    // 3. Seed Courier Packages if empty
    const packagesSnap = await getDocs(collection(firestore, 'packages'));
    if (packagesSnap.empty) {
      for (const pkg of DEFAULT_PACKAGES) {
        const { id, ...pkgData } = pkg;
        await addDoc(collection(firestore, 'packages'), pkgData);
      }
    }
    
    // 4. Seed Audit Logs if empty
    const logsSnap = await getDocs(collection(firestore, 'activity_logs'));
    if (logsSnap.empty) {
      for (const log of DEFAULT_LOGS) {
        const { id, ...logData } = log;
        await addDoc(collection(firestore, 'activity_logs'), logData);
      }
    }
    
    console.log("Cloud Firestore database seeding/update check completed!");

    // Initialize/Seed Firebase Auth logins
    const authInstance = getAuth(app);
    for (const st of DEFAULT_STAFF) {
      try {
        await createUserWithEmailAndPassword(authInstance, st.email, st.password);
        console.log(`Successfully seeded Firebase Auth account: ${st.email}`);
      } catch (err) {
        if (err.code !== 'auth/email-already-in-use') {
          console.error(`Auth account seeding error for ${st.email}:`, err);
        }
      }
    }
  } catch (error) {
    console.error("Error during Firestore seeding check:", error);
  }
};

// Trigger Firestore check/seed
checkAndSeedDatabase();

// Listeners tracking for mock subscriptions
const packageSubscribers = new Set();
const logsSubscribers = new Set();
const staffSubscribers = new Set();
const studentSubscribers = new Set();

const triggerSubscribers = (subscribers, data) => {
  subscribers.forEach(cb => {
    try { cb(data); } catch (e) { console.error(e); }
  });
};

// Listen to storage changes from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === MOCK_PACKAGES_KEY) {
    triggerSubscribers(packageSubscribers, JSON.parse(e.newValue));
  }
  if (e.key === MOCK_LOGS_KEY) {
    triggerSubscribers(logsSubscribers, JSON.parse(e.newValue));
  }
  if (e.key === MOCK_STAFF_KEY) {
    triggerSubscribers(staffSubscribers, JSON.parse(e.newValue));
  }
  if (e.key === MOCK_STUDENTS_KEY) {
    triggerSubscribers(studentSubscribers, JSON.parse(e.newValue));
  }
});

// --- EXPORTED DATABASE FUNCTIONS ---

// 1. Packages
export const subscribePackages = (callback) => {
  if (isFirebaseActive) {
    const q = query(collection(firestore, 'packages'), orderBy('dateReceived', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(pkgs);
    }, (error) => {
      console.error("Firestore packages subscription error:", error);
    });
  } else {
    packageSubscribers.add(callback);
    // Initial call
    const currentPackages = getStoredData(MOCK_PACKAGES_KEY, DEFAULT_PACKAGES);
    // Sort desc by dateReceived
    const sorted = [...currentPackages].sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
    callback(sorted);
    return () => packageSubscribers.delete(callback);
  }
};

export const addPackage = async (packageData, currentUserEmail) => {
  const newPkg = {
    ...packageData,
    dateReceived: new Date().toISOString(),
    status: 'Received',
    receivedBy: currentUserEmail || 'Staff',
    collectionDate: null,
    verifiedBy: null
  };

  if (isFirebaseActive) {
    const docRef = await addDoc(collection(firestore, 'packages'), newPkg);
    await addActivityLog(`Package added: ${newPkg.studentName} (${newPkg.enrollmentNumber}) at ${newPkg.shelfLocation}`, currentUserEmail);
    return docRef.id;
  } else {
    const pkgs = getStoredData(MOCK_PACKAGES_KEY, DEFAULT_PACKAGES);
    const id = 'pkg-' + Date.now();
    const pkgWithId = { id, ...newPkg };
    pkgs.push(pkgWithId);
    writeStoredData(MOCK_PACKAGES_KEY, pkgs);
    
    // Notify subscribers
    const sorted = [...pkgs].sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
    triggerSubscribers(packageSubscribers, sorted);
    
    await addActivityLog(`Package added: ${newPkg.studentName} (${newPkg.enrollmentNumber}) at ${newPkg.shelfLocation}`, currentUserEmail);
    return id;
  }
};

export const markPackageCollected = async (packageId, staffName, currentUserEmail) => {
  const updateData = {
    status: 'Collected',
    collectionDate: new Date().toISOString(),
    verifiedBy: staffName || currentUserEmail || 'Staff'
  };

  if (isFirebaseActive) {
    const docRef = doc(firestore, 'packages', packageId);
    await updateDoc(docRef, updateData);
    
    // Fetch package details for log
    const docSnap = await getDocs(query(collection(firestore, 'packages')));
    const pkg = docSnap.docs.find(d => d.id === packageId)?.data();
    const pkgName = pkg ? `${pkg.studentName} (${pkg.enrollmentNumber})` : packageId;
    
    await addActivityLog(`Package marked Collected: ${pkgName}, verified by ${staffName}`, currentUserEmail);
  } else {
    const pkgs = getStoredData(MOCK_PACKAGES_KEY, DEFAULT_PACKAGES);
    const idx = pkgs.findIndex(p => p.id === packageId);
    if (idx !== -1) {
      pkgs[idx] = { ...pkgs[idx], ...updateData };
      writeStoredData(MOCK_PACKAGES_KEY, pkgs);
      
      const sorted = [...pkgs].sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
      triggerSubscribers(packageSubscribers, sorted);
      
      const pkg = pkgs[idx];
      await addActivityLog(`Package marked Collected: ${pkg.studentName} (${pkg.enrollmentNumber}), verified by ${staffName}`, currentUserEmail);
    } else {
      throw new Error("Package not found");
    }
  }
};

// 2. Activity Logs
export const subscribeLogs = (callback) => {
  if (isFirebaseActive) {
    const q = query(collection(firestore, 'activity_logs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(logs);
    });
  } else {
    logsSubscribers.add(callback);
    const logs = getStoredData(MOCK_LOGS_KEY, DEFAULT_LOGS);
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    callback(sorted);
    return () => logsSubscribers.delete(callback);
  }
};

export const addActivityLog = async (details, userEmail) => {
  const newLog = {
    timestamp: new Date().toISOString(),
    details,
    user: userEmail || 'System'
  };

  if (isFirebaseActive) {
    await addDoc(collection(firestore, 'activity_logs'), newLog);
  } else {
    const logs = getStoredData(MOCK_LOGS_KEY, DEFAULT_LOGS);
    const id = 'log-' + Date.now();
    logs.push({ id, ...newLog });
    writeStoredData(MOCK_LOGS_KEY, logs);
    
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    triggerSubscribers(logsSubscribers, sorted);
  }
};

// 3. Staff Accounts Management
export const subscribeStaff = (callback) => {
  if (isFirebaseActive) {
    const q = query(collection(firestore, 'staff'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(staffList);
    });
  } else {
    staffSubscribers.add(callback);
    const staffList = getStoredData(MOCK_STAFF_KEY, DEFAULT_STAFF);
    callback(staffList);
    return () => staffSubscribers.delete(callback);
  }
};

export const addStaffAccount = async (staffData, currentUserEmail) => {
  const newStaff = {
    email: staffData.email,
    name: staffData.name,
    role: staffData.role || 'staff',
    active: true
  };

  if (isFirebaseActive) {
    // Note: Creating in Firestore. 
    // In live Firebase, standard Firebase Auth user creation is handled separately or through admin functions.
    // For this dashboard interface, we write to the staff directory.
    const docRef = doc(firestore, 'staff', staffData.email.replace(/\./g, '_'));
    await setDoc(docRef, newStaff);
    await addActivityLog(`Staff account created: ${newStaff.name} (${newStaff.email}) as ${newStaff.role}`, currentUserEmail);
  } else {
    const staffList = getStoredData(MOCK_STAFF_KEY, DEFAULT_STAFF);
    
    // Check if duplicate email
    if (staffList.some(s => s.email.toLowerCase() === staffData.email.toLowerCase())) {
      throw new Error("Staff account with this email already exists");
    }

    const id = 'staff-' + Date.now();
    const accountWithPw = { 
      id, 
      ...newStaff, 
      password: staffData.password || 'welcome123' // Default password
    };
    staffList.push(accountWithPw);
    writeStoredData(MOCK_STAFF_KEY, staffList);
    triggerSubscribers(staffSubscribers, staffList);
    
    await addActivityLog(`Staff account created: ${newStaff.name} (${newStaff.email}) as ${newStaff.role}`, currentUserEmail);
  }
};

export const deleteStaffAccount = async (staffIdOrEmail, currentUserEmail) => {
  if (isFirebaseActive) {
    const key = staffIdOrEmail.replace(/\./g, '_');
    await deleteDoc(doc(firestore, 'staff', key));
    await addActivityLog(`Staff account deleted/disabled: ${staffIdOrEmail}`, currentUserEmail);
  } else {
    const staffList = getStoredData(MOCK_STAFF_KEY, DEFAULT_STAFF);
    const updated = staffList.filter(s => s.id !== staffIdOrEmail && s.email !== staffIdOrEmail);
    
    const deletedUser = staffList.find(s => s.id === staffIdOrEmail || s.email === staffIdOrEmail);
    const desc = deletedUser ? `${deletedUser.name} (${deletedUser.email})` : staffIdOrEmail;
    
    writeStoredData(MOCK_STAFF_KEY, updated);
    triggerSubscribers(staffSubscribers, updated);
    
    await addActivityLog(`Staff account deleted: ${desc}`, currentUserEmail);
  }
};

// 4. Student Directory Management
export const subscribeStudents = (callback) => {
  if (isFirebaseActive) {
    const q = query(collection(firestore, 'students'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(studentsList);
    });
  } else {
    studentSubscribers.add(callback);
    const studentsList = getStoredData(MOCK_STUDENTS_KEY, DEFAULT_STUDENTS);
    callback(studentsList);
    return () => studentSubscribers.delete(callback);
  }
};

export const addStudent = async (studentData, currentUserEmail) => {
  const newStudent = {
    enrollmentNumber: studentData.enrollmentNumber.trim().toUpperCase(),
    name: studentData.name.trim(),
    photo: studentData.photo || generateInitialsAvatar(studentData.name),
    status: 'active'
  };

  if (isFirebaseActive) {
    const docRef = doc(firestore, 'students', newStudent.enrollmentNumber.replace(/\//g, '_'));
    await setDoc(docRef, newStudent);
    await addActivityLog(`Student registered: ${newStudent.name} (${newStudent.enrollmentNumber})`, currentUserEmail);
  } else {
    const students = getStoredData(MOCK_STUDENTS_KEY, DEFAULT_STUDENTS);
    if (students.some(s => s.enrollmentNumber === newStudent.enrollmentNumber)) {
      throw new Error("Student with this enrollment number is already registered.");
    }
    students.push(newStudent);
    writeStoredData(MOCK_STUDENTS_KEY, students);
    triggerSubscribers(studentSubscribers, students);
    
    await addActivityLog(`Student registered: ${newStudent.name} (${newStudent.enrollmentNumber})`, currentUserEmail);
  }
};

export const addStudentsBulk = async (studentList, currentUserEmail) => {
  if (isFirebaseActive) {
    for (const student of studentList) {
      if (!student.enrollmentNumber || !student.name) continue;
      const cleanEnroll = student.enrollmentNumber.trim().toUpperCase();
      const cleanName = student.name.trim();
      const photo = student.photo || generateInitialsAvatar(cleanName);
      const docRef = doc(firestore, 'students', cleanEnroll.replace(/\//g, '_'));
      await setDoc(docRef, { enrollmentNumber: cleanEnroll, name: cleanName, photo, status: 'active' });
    }
    await addActivityLog(`Bulk registered ${studentList.length} students via file upload.`, currentUserEmail);
  } else {
    const students = getStoredData(MOCK_STUDENTS_KEY, DEFAULT_STUDENTS);
    let count = 0;
    for (const student of studentList) {
      if (!student.enrollmentNumber || !student.name) continue;
      const cleanEnroll = student.enrollmentNumber.trim().toUpperCase();
      const cleanName = student.name.trim();
      const photo = student.photo || generateInitialsAvatar(cleanName);
      if (!students.some(s => s.enrollmentNumber === cleanEnroll)) {
        students.push({ enrollmentNumber: cleanEnroll, name: cleanName, photo, status: 'active' });
        count++;
      }
    }
    writeStoredData(MOCK_STUDENTS_KEY, students);
    triggerSubscribers(studentSubscribers, students);
    
    await addActivityLog(`Bulk uploaded student list: ${count} new students added (total: ${studentList.length}).`, currentUserEmail);
  }
};

export const toggleStudentStatus = async (enrollmentNumber, currentUserEmail) => {
  const cleanEnroll = enrollmentNumber.trim().toUpperCase();
  if (isFirebaseActive) {
    const docId = cleanEnroll.replace(/\//g, '_');
    const docRef = doc(firestore, 'students', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const current = docSnap.data();
      const newStatus = current.status === 'inactive' ? 'active' : 'inactive';
      await updateDoc(docRef, { status: newStatus });
      await addActivityLog(`Student status changed: ${current.name} (${cleanEnroll}) set to ${newStatus}`, currentUserEmail);
    }
  } else {
    const students = getStoredData(MOCK_STUDENTS_KEY, DEFAULT_STUDENTS);
    const index = students.findIndex(s => s.enrollmentNumber?.trim().toUpperCase() === cleanEnroll);
    if (index !== -1) {
      // Clone student object to ensure React detects state/reference updates
      const student = { ...students[index] };
      const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
      student.status = newStatus;
      students[index] = student;
      writeStoredData(MOCK_STUDENTS_KEY, students);
      triggerSubscribers(studentSubscribers, [...students]);
      await addActivityLog(`Student status changed: ${student.name} (${cleanEnroll}) set to ${newStatus}`, currentUserEmail);
    }
  }
};

export const deleteStudent = async (enrollmentNumber, currentUserEmail) => {
  const cleanEnroll = enrollmentNumber.trim().toUpperCase();
  if (isFirebaseActive) {
    const docId = cleanEnroll.replace(/\//g, '_');
    const docRef = doc(firestore, 'students', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const current = docSnap.data();
      await deleteDoc(docRef);
      await addActivityLog(`Student deleted: ${current.name} (${cleanEnroll})`, currentUserEmail);
    }
  } else {
    const students = getStoredData(MOCK_STUDENTS_KEY, DEFAULT_STUDENTS);
    const index = students.findIndex(s => s.enrollmentNumber?.trim().toUpperCase() === cleanEnroll);
    if (index !== -1) {
      const student = students[index];
      const newStudents = students.filter(s => s.enrollmentNumber?.trim().toUpperCase() !== cleanEnroll);
      writeStoredData(MOCK_STUDENTS_KEY, newStudents);
      triggerSubscribers(studentSubscribers, [...newStudents]);
      await addActivityLog(`Student deleted: ${student.name} (${cleanEnroll})`, currentUserEmail);
    }
  }
};

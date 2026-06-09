import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { isFirebaseActive, firestore } from './db';
import { getDoc, doc } from 'firebase/firestore';

let auth;
if (isFirebaseActive) {
  try {
    auth = getAuth();
  } catch (error) {
    console.error("Firebase Auth initialization failed:", error);
  }
}

const CURRENT_USER_KEY = 'campus_courier_current_user';
const STAFF_KEY = 'campus_courier_staff';

const authSubscribers = new Set();
let currentUser = null;

// Load persisted user session from LocalStorage (if not using Firebase)
if (!isFirebaseActive) {
  const persisted = localStorage.getItem(CURRENT_USER_KEY);
  if (persisted) {
    try {
      currentUser = JSON.parse(persisted);
    } catch (e) {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
}

const notifyAuthSubscribers = () => {
  authSubscribers.forEach(cb => {
    try { cb(currentUser); } catch (e) { console.error(e); }
  });
};

// If Firebase is active, hook its Auth State to our system
if (isFirebaseActive && auth) {
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      // In Firebase mode, read their user role from the Firestore 'staff' collection.
      let role = 'staff';
      let name = fbUser.displayName || fbUser.email.split('@')[0];
      
      try {
        const docRef = doc(firestore, 'staff', fbUser.email.replace(/\./g, '_'));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          role = data.role || 'staff';
          name = data.name || name;
        }
      } catch (e) {
        console.error("Error reading staff document from Firestore:", e);
      }

      currentUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        role: fbUser.email.toLowerCase().includes('admin') ? 'admin' : role
      };
    } else {
      currentUser = null;
    }
    notifyAuthSubscribers();
  });
}

// --- EXPORTED AUTH FUNCTIONS ---

export const subscribeAuth = (callback) => {
  authSubscribers.add(callback);
  // Initial fire
  callback(currentUser);
  return () => authSubscribers.delete(callback);
};

export const getCurrentUser = () => currentUser;

export const login = async (email, password) => {
  if (isFirebaseActive && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle updating the currentUser state.
      return userCredential.user;
    } catch (error) {
      let friendlyMessage = "Invalid credentials";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        friendlyMessage = "Incorrect email or password";
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = "Please enter a valid email address";
      }
      throw new Error(friendlyMessage);
    }
  } else {
    // LocalStorage login verification
    const staffData = localStorage.getItem(STAFF_KEY);
    if (!staffData) {
      throw new Error("Local database not initialized");
    }

    const staffList = JSON.parse(staffData);
    const matched = staffList.find(s => 
      s.email.toLowerCase() === email.toLowerCase() && 
      s.password === password
    );

    if (!matched) {
      throw new Error("Incorrect email or password");
    }

    if (!matched.active) {
      throw new Error("This staff account is suspended. Please contact the administrator.");
    }

    currentUser = {
      uid: matched.id,
      email: matched.email,
      name: matched.name,
      role: matched.role
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    notifyAuthSubscribers();
    return currentUser;
  }
};

export const logout = async () => {
  if (isFirebaseActive && auth) {
    await fbSignOut(auth);
  } else {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    notifyAuthSubscribers();
  }
};

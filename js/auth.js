/**
 * Sales Insight Pro - Firebase Backend Connection
 * This script provides the production API layer for authentication using Firebase.
 */

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    getDocs, 
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const ADMIN_CODE = 'MASTER2026';

class FirebaseAuth {
    constructor() {
        this.session = null;
        this.init();
    }

    async init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                this.session = {
                    id: user.uid,
                    username: user.email.split('@')[0],
                    email: user.email,
                    role: userData?.role || 'user',
                    token: await user.getIdToken()
                };
            } else {
                this.session = null;
            }
        });
    }

    // API: Signup
    async signup(email, password, adminCode = '') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const role = (adminCode === ADMIN_CODE) ? 'admin' : 'user';

            // Store user profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: email.split('@')[0],
                email: email,
                role: role,
                createdAt: new Date().toISOString(),
                isOnline: true,
                lastActive: new Date().toISOString()
            });

            return { message: "Registration successful!", user: { email: user.email, role } };
        } catch (error) {
            throw { message: error.message };
        }
    }

    // API: Login
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            // Ensure user profile exists and update status
            await setDoc(doc(db, "users", user.uid), {
                isOnline: true,
                lastActive: new Date().toISOString(),
                // Fallback fields in case the doc didn't exist
                email: email,
                username: email.split('@')[0],
                role: userData?.role || 'user'
            }, { merge: true });

            this.session = {
                id: user.uid,
                username: userData?.username || email.split('@')[0],
                email: email,
                role: userData?.role || 'user',
                token: await user.getIdToken()
            };

            return { message: "Login successful!", user: this.session };
        } catch (error) {
            throw { message: error.message };
        }
    }

    // Logout
    async logout() {
        if (auth.currentUser) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                isOnline: false
            });
        }
        await signOut(auth);
        this.session = null;
        window.location.href = 'login.html';
    }

    // Get current session
    getCurrentUser() {
        return this.session;
    }

    // Auth Guard for pages
    checkAuth(redirectOnFail = true) {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    if (redirectOnFail) window.location.href = 'login.html';
                    resolve(null);
                } else {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();
                    this.session = {
                        id: user.uid,
                        username: userData?.username || user.email.split('@')[0],
                        email: user.email,
                        role: userData?.role || 'user',
                        token: await user.getIdToken()
                    };
                    resolve(this.session);
                }
            });
        });
    }

    // Admin Only: Get all users
    async getAllUsers() {
        if (!this.session || this.session.role !== 'admin') {
            throw { message: "Access Denied." };
        }
        
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    // Admin Only: Delete user
    async deleteUser(userId) {
        if (!this.session || this.session.role !== 'admin') {
            throw { message: "Access Denied." };
        }
        await deleteDoc(doc(db, "users", userId));
        return { message: "User deleted successfully." };
    }
}

// Global instance for compatibility with existing UI
const firebaseAuth = new FirebaseAuth();
window.auth = firebaseAuth;
export default firebaseAuth;

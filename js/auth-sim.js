/**
 * Sales Insight Pro - Simulated Persistent Backend (localStorage)
 * This script provides a simulated API layer for authentication and user management.
 */

const AUTH_STORAGE_KEY = 'insightpro_users';
const SESSION_STORAGE_KEY = 'insightpro_session';
const ADMIN_CODE = 'MASTER2026';

class AuthSim {
    constructor() {
        this.users = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || [];
        this.session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)) || null;

        // Ensure default admin exists
        const adminExists = this.users.find(u => u.username === 'admin');
        if (!adminExists) {
            this.users.push({
                id: 'admin-0',
                username: 'admin',
                password: btoa('admin'), // Simulated hashing for 'admin'
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.users));
        }

        if (this.users.length === 0) {
            console.log("Auth System Initialized. No users found.");
        }
    }

    // Helper: Save state to localStorage
    _save() {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.users));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
    }

    // Simulated API: Signup
    signup(username, password, adminCode = '') {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.users.find(u => u.username === username)) {
                    return reject({ message: "Username already exists." });
                }

                const newUser = {
                    id: Date.now().toString(),
                    username,
                    password: btoa(password), // Simulated hashing
                    role: (adminCode === ADMIN_CODE) ? 'admin' : 'user',
                    createdAt: new Date().toISOString()
                };

                this.users.push(newUser);
                this._save();
                resolve({ message: "Registration successful!", user: { username: newUser.username, role: newUser.role } });
            }, 600);
        });
    }

    // Simulated API: Login
    login(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = this.users.find(u => u.username === username && u.password === btoa(password));
                if (!user) {
                    return reject({ message: "Invalid username or password." });
                }

                user.isOnline = true;
                user.lastActive = new Date().toISOString();
                
                this.session = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    token: 'sim-jwt-' + Math.random().toString(36).substring(7)
                };
                this._save();
                resolve({ message: "Login successful!", user: this.session });
            }, 800);
        });
    }

    // Heartbeat: Keeps the user "Online" while the page is open
    heartbeat() {
        if (this.session) {
            const user = this.users.find(u => u.id === this.session.id);
            if (user) {
                user.isOnline = true;
                user.lastActive = new Date().toISOString();
                this._save();
            }
        }
    }

    // Logout
    logout() {
        if (this.session) {
            const user = this.users.find(u => u.id === this.session.id);
            if (user) {
                user.isOnline = false;
            }
        }
        this.session = null;
        this._save();
        window.location.href = 'login.html';
    }

    // Get current session
    getCurrentUser() {
        return this.session;
    }

    // Auth Guard for pages
    checkAuth(redirectOnFail = true) {
        if (!this.session && redirectOnFail) {
            window.location.href = 'login.html';
            return null;
        }
        // Run initial heartbeat
        this.heartbeat();
        // Set interval for continuous heartbeat (every 30s)
        setInterval(() => this.heartbeat(), 30000);
        return this.session;
    }

    // Admin Only: Get all users
    getAllUsers() {
        if (!this.session || this.session.role !== 'admin') {
            return Promise.reject({ message: "Access Denied." });
        }
        
        // Before returning, stale-check: if lastActive > 1 minute ago, set isOnline to false
        const now = new Date();
        this.users.forEach(u => {
            if (u.isOnline && u.lastActive) {
                const lastActive = new Date(u.lastActive);
                if ((now - lastActive) > 60000) {
                    u.isOnline = false;
                }
            }
        });
        this._save();

        return Promise.resolve(this.users.map(u => ({ 
            id: u.id, 
            username: u.username, 
            role: u.role, 
            createdAt: u.createdAt,
            isOnline: u.isOnline,
            lastActive: u.lastActive
        })));
    }

    // Admin Only: Delete user
    deleteUser(userId) {
        if (!this.session || this.session.role !== 'admin') {
            return Promise.reject({ message: "Access Denied." });
        }
        this.users = this.users.filter(u => u.id !== userId);
        this._save();
        return Promise.resolve({ message: "User deleted successfully." });
    }

    // Admin Only: Reset Password
    resetPassword(userId, newPassword = 'Reset123!') {
        if (!this.session || this.session.role !== 'admin') {
            return Promise.reject({ message: "Access Denied." });
        }
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.password = btoa(newPassword);
            this._save();
            return Promise.resolve({ message: `Password reset to: ${newPassword}` });
        }
        return Promise.reject({ message: "User not found." });
    }
}

// Global instance
const auth = new AuthSim();
window.auth = auth;

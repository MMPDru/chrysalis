import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserPreferences {
    favoriteAuthors: string[];
    customAuthors: string[];
    defaultExportFormat: 'word' | 'pdf';
}

interface UserData {
    email: string;
    displayName: string;
    createdAt: Date;
    preferences: UserPreferences;
    hasCompletedSetup: boolean;
}

interface AuthContextType {
    currentUser: User | null;
    userData: UserData | null;
    loading: boolean;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
    completeSetup: (displayName: string, favoriteAuthors: string[], customAuthors: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async (user: User) => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserData(user);
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, password: string, displayName: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });

        // Create user document
        const newUserData: UserData = {
            email,
            displayName,
            createdAt: new Date(),
            preferences: {
                favoriteAuthors: ['Carl Jung', 'Michael Singer', 'Alan Watts'],
                customAuthors: [],
                defaultExportFormat: 'pdf'
            },
            hasCompletedSetup: false
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), newUserData);
        setUserData(newUserData);
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
        if (!currentUser) return;

        const updatedPreferences = { ...userData?.preferences, ...preferences };
        await updateDoc(doc(db, 'users', currentUser.uid), {
            'preferences': updatedPreferences
        });

        if (userData) {
            setUserData({ ...userData, preferences: updatedPreferences as UserPreferences });
        }
    };

    const completeSetup = async (displayName: string, favoriteAuthors: string[], customAuthors: string[]) => {
        if (!currentUser) return;

        await updateProfile(currentUser, { displayName });
        await updateDoc(doc(db, 'users', currentUser.uid), {
            displayName,
            'preferences.favoriteAuthors': favoriteAuthors,
            'preferences.customAuthors': customAuthors,
            hasCompletedSetup: true
        });

        if (userData) {
            setUserData({
                ...userData,
                displayName,
                hasCompletedSetup: true,
                preferences: {
                    ...userData.preferences,
                    favoriteAuthors,
                    customAuthors
                }
            });
        }
    };

    const value = {
        currentUser,
        userData,
        loading,
        signup,
        login,
        logout,
        updateUserPreferences,
        completeSetup
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

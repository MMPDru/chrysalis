import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WelcomeWizard from '../components/WelcomeWizard';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { currentUser, userData, completeSetup } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Show welcome wizard for first-time users
    if (userData && !userData.hasCompletedSetup) {
        return (
            <WelcomeWizard
                initialDisplayName={userData.displayName}
                onComplete={completeSetup}
            />
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
    return (
        <div className="app-container">
            <Sidebar />
            <Header />
            <main style={{
                gridArea: 'main',
                padding: '2rem',
                overflowY: 'auto'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

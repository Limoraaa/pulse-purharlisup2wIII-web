//import custom components
import Header from "layouts/header/Header";
import Sidebar from "layouts/Sidebar";
import AuthGuard from "components/auth/AuthGuard";
import UnreturnedAlertModal from "components/common/UnreturnedAlertModal"; // <-- 1. Tambahkan import modal

interface DashboardProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardProps> = ({ children }) => {
  return (
    <AuthGuard>
      <div>
        <Sidebar hideLogo={false} containerId='miniSidebar' />
        <div id='content' className='position-relative h-100'>
          <Header />
          <div className='custom-container'>
            {/* 2. Pasang komponen modal di dalam area konten */}
            <UnreturnedAlertModal />
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
//import custom components
import Header from "layouts/header/Header";
import Sidebar from "layouts/Sidebar";
import AuthGuard from "components/auth/AuthGuard";

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
          <div className='custom-container'>{children}</div>
         
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
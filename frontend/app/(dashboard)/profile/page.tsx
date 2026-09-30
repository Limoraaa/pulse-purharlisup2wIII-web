// import node module libraries
import { Metadata } from "next";

// import custom components
import ProfileManager from "components/ruangtools/profile/ProfileManager";

export const metadata: Metadata = {
  title: "Profil Saya | Ruang Tools",
  description: "Kelola informasi profil dan keamanan akun Ruang Tools",
};

const ProfilePage = () => {
  return <ProfileManager />;
};

export default ProfilePage;

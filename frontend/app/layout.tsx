//import modules libraries
import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";

//import custom components
import ClientWrapper from "components/common/ClientWrapper";

// import main theme scss
import '../styles/theme.scss';

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PULSE PUSHARLIS",
  description: "Sistem Ruang Tools dan Manajemen Mesin Produksi PT PLN (Persero) Pusharlis UP2W III",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientWrapper>
      <html lang="en" className="expanded">
        <body className={`${publicSans.variable}`}>
          {/* UnreturnedAlertModal DIHAPUS DARI SINI */}
          {children}
        </body>
      </html>
    </ClientWrapper>
  );
}
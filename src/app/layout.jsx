import './globals.css';
import AdminShell from '../components/AdminShell';

export const metadata = {
  title: 'Bhagwn Solutions - Admin Portal',
  description: 'Management & Administrative Platform for Bhagwn Solutions MLM System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F0E6] text-[#211E1A] antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

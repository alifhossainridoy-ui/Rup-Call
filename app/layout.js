import './globals.css';
import { ToastContainer } from '@/components/Toast';
import { AuthSessionProvider } from './SessionProvider';

export const metadata = {
  title: 'Rup Call CRM',
  description: 'Call center CRM system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthSessionProvider>
          {children}
          <ToastContainer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

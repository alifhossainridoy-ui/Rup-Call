import './globals.css';

export const metadata = {
  title: 'Rup Call CRM',
  description: 'Call center CRM system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}

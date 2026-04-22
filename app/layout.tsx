import './globals.css';

export const metadata = {
  title: 'TCU Lost & Found',
  description: 'Taguig City University Lost and Found Hub',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
import './globals.css';

export const metadata = {
  title: 'ReadingSpace',
  description: 'Semantic search for your personal book library'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


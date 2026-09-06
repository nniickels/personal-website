import "./globals.css";

export const metadata = {
  title: "Nicole Jiang",
  description: "Nicole Jiang's personal website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

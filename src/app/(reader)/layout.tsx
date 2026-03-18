export default function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3">
        <span className="font-semibold">OpenLex</span>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-3 text-sm text-gray-500">
        © OpenLex – CC-BY-SA-4.0
      </footer>
    </div>
  );
}

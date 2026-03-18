import UserButton from "@/components/user-button";
import { SearchBox } from "@/components/search-box";

export default function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="font-semibold">OpenLex</a>
        <div className="flex items-center gap-4">
          <SearchBox />
          <UserButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-3 text-sm text-gray-500">
        © OpenLex – CC-BY-SA-4.0
      </footer>
    </div>
  );
}

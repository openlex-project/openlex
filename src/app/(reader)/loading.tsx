export default function Loading() {
  return (
    <div className="flex-1 animate-pulse p-6 max-w-3xl mx-auto w-full">
      <div className="h-8 bg-current/5 rounded w-2/3 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-current/5 rounded w-full" />
        <div className="h-4 bg-current/5 rounded w-5/6" />
        <div className="h-4 bg-current/5 rounded w-4/6" />
        <div className="h-4 bg-current/5 rounded w-full" />
        <div className="h-4 bg-current/5 rounded w-3/6" />
      </div>
    </div>
  );
}

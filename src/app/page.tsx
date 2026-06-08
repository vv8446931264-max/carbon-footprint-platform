import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex w-full flex-1 flex-col items-center">
        <Dashboard />
      </main>
    </div>
  );
}

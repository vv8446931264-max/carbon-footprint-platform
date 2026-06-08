import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center">
      <main
        id="main-content"
        className="flex w-full flex-1 flex-col items-center"
      >
        <Dashboard />
      </main>
    </div>
  );
}

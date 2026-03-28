import { Nav } from "@/components/nav";
import { FloatingAddButton } from "@/components/floating-add-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <FloatingAddButton />
    </>
  );
}

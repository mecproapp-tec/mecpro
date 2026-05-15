import { ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex bg-black text-white">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}
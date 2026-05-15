import { ReactNode } from "react";
import PrivateRoute from "../routes/PrivateRoute";
import Layout from "./Layout"; // ✅ corrigido: mesmo diretório

interface PrivateLayoutProps {
  children: ReactNode;
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}
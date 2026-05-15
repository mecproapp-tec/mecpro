import { useAuth } from "./context/AuthContext";

export default function CabecalhoDocumento() {
  const { user } = useAuth();
  if (!user) return null;

  const oficinaData = {
    nome: user.officeName || user.name || "Oficina",
    endereco: user.address || "Endereço não cadastrado",
    telefone: user.phone || "",
    email: user.email || "",
    logo: user.logo || null,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #00e5ff", paddingBottom: "16px" }}>
      {oficinaData.logo && <img src={oficinaData.logo} alt="logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />}
      <div>
        <h2 style={{ color: "#00e5ff", margin: 0 }}>{oficinaData.nome}</h2>
        <p style={{ margin: "4px 0", color: "#fff" }}>{oficinaData.endereco}</p>
        <p style={{ margin: "4px 0", color: "#fff" }}>Tel: {oficinaData.telefone} | E-mail: {oficinaData.email}</p>
      </div>
    </div>
  );
}
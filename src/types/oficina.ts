export interface Oficina {

  id: string
  nome: string
  email: string

  plano: string

  status: "trial" | "ativo" | "cancelado"

  createdAt: string
}

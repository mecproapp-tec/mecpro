import { Link } from "react-router-dom";
import { FiUsers, FiFileText, FiDollarSign, FiCalendar, FiShield, FiZap, FiArrowRight } from "react-icons/fi";

export default function LandingPage() {
  const features = [
    { icon: FiUsers, title: "Gestão de Clientes", description: "Cadastre e organize todos os seus clientes em um só lugar" },
    { icon: FiFileText, title: "Orçamentos", description: "Crie orçamentos profissionais e envie por WhatsApp" },
    { icon: FiDollarSign, title: "Faturas", description: "Controle financeiro com faturas e cobranças" },
    { icon: FiCalendar, title: "Agendamentos", description: "Gerencie sua agenda e nunca perca um compromisso" },
    { icon: FiShield, title: "Seguro e Confiável", description: "Seus dados protegidos com criptografia de ponta" },
    { icon: FiZap, title: "Rápido e Eficiente", description: "Interface moderna e intuitiva para sua oficina" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            MecPro
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            A solução completa para gestão de oficinas mecânicas
          </p>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Gerencie clientes, orçamentos, faturas e agendamentos em um só lugar.
            Simplifique sua rotina e aumente a produtividade da sua oficina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Começar Agora <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-all duration-300"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Por que escolher o <span className="text-cyan-400">MecPro</span>?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-cyan-400" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 mb-20">
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-3xl p-12 text-center border border-cyan-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar sua oficina?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de oficinas que já estão utilizando o MecPro
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
          >
            Começar Agora <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 MecPro - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
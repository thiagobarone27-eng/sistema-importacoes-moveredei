import {
  LayoutDashboard,
  PackageSearch,
  PlusCircle,
  Gauge,
  GitCompareArrows,
  Boxes,
  Building2,
  FileBarChart2,
  UploadCloud,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  titulo: string;
  itens: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titulo: "Visão geral",
    itens: [{ label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
  },
  {
    titulo: "Importações",
    itens: [
      { label: "Todas as importações", to: "/importacoes", icon: PackageSearch },
      { label: "Nova importação", to: "/importacoes/nova", icon: PlusCircle },
    ],
  },
  {
    titulo: "Análises",
    itens: [
      { label: "Eficiência", to: "/eficiencia", icon: Gauge },
      { label: "Comparação", to: "/comparacao", icon: GitCompareArrows },
      { label: "Por produto", to: "/produtos", icon: Boxes },
      { label: "Por empresa", to: "/empresas", icon: Building2 },
    ],
  },
  {
    titulo: "Relatórios",
    itens: [
      { label: "Relatórios", to: "/relatorios", icon: FileBarChart2 },
      { label: "Importar planilha", to: "/importar", icon: UploadCloud },
    ],
  },
  {
    titulo: "Sistema",
    itens: [{ label: "Configurações", to: "/configuracoes", icon: Settings }],
  },
];

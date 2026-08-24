import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ImportacoesList } from "./pages/importacoes/ImportacoesList";
import { ImportacaoForm } from "./pages/importacoes/ImportacaoForm";
import { ImportacaoDetail } from "./pages/importacoes/ImportacaoDetail";
import { Eficiencia } from "./pages/Eficiencia";
import { EficienciaConfig } from "./pages/EficienciaConfig";
import { Comparacao } from "./pages/Comparacao";
import { ProdutosList } from "./pages/produtos/ProdutosList";
import { ProdutoDetail } from "./pages/produtos/ProdutoDetail";
import { EmpresasList } from "./pages/empresas/EmpresasList";
import { EmpresaDetail } from "./pages/empresas/EmpresaDetail";
import { Relatorios } from "./pages/Relatorios";
import { ImportarPlanilha } from "./pages/ImportarPlanilha";
import { Configuracoes } from "./pages/Configuracoes";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route path="importacoes" element={<ImportacoesList />} />
          <Route path="importacoes/nova" element={<ImportacaoForm />} />
          <Route path="importacoes/:id/editar" element={<ImportacaoForm />} />
          <Route path="importacoes/:id" element={<ImportacaoDetail />} />

          <Route path="eficiencia" element={<Eficiencia />} />
          <Route path="comparacao" element={<Comparacao />} />

          <Route path="produtos" element={<ProdutosList />} />
          <Route path="produtos/:id" element={<ProdutoDetail />} />

          <Route path="empresas" element={<EmpresasList />} />
          <Route path="empresas/:id" element={<EmpresaDetail />} />

          <Route path="relatorios" element={<Relatorios />} />
          <Route path="importar" element={<ImportarPlanilha />} />

          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="configuracoes/eficiencia" element={<EficienciaConfig />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

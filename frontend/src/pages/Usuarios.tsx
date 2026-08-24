import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserCircle } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Label, Select, FieldError } from "../components/ui/Field";
import { ErrorState, LoadingState } from "../components/ui/States";
import { TableShell, Td, Th } from "../components/ui/Table";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../lib/AuthContext";
import { authApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { formatDateTime } from "../lib/format";
import type { Papel, Usuario } from "../api/types";

export function Usuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const usuarios = useAsync(() => authApi.listarUsuarios(), []);

  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/configuracoes" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft size={15} /> Voltar para configurações
        </Link>
        <PageHeader
          title="Usuários e permissões"
          subtitle="Quem tem acesso ao sistema e o que cada pessoa pode fazer."
          actions={
            <Button icon={<Plus size={16} />} onClick={() => setModalNovo(true)}>
              Novo usuário
            </Button>
          }
        />
      </div>

      <Card>
        {usuarios.loading && <LoadingState label="Carregando usuários..." />}
        {usuarios.error && (
          <div className="p-6">
            <ErrorState message={usuarios.error} onRetry={usuarios.reload} />
          </div>
        )}
        {usuarios.data && (
          <TableShell>
            <thead>
              <tr>
                <Th>Usuário</Th>
                <Th>Papel</Th>
                <Th>Status</Th>
                <Th>Criado em</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {usuarios.data.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <UserCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-800">
                          {u.nome}
                          {u.id === usuarioLogado?.id && <span className="ml-1.5 text-xs text-ink-400">(você)</span>}
                        </p>
                        <p className="truncate text-xs text-ink-500">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {u.papel === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <ShieldCheck size={12} /> Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                        Visualizador
                      </span>
                    )}
                  </Td>
                  <Td>
                    {u.ativo ? (
                      <span className="inline-flex items-center rounded-full bg-good-50 px-2 py-0.5 text-xs font-medium text-good-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
                        Desativado
                      </span>
                    )}
                  </Td>
                  <Td className="text-ink-500">{formatDateTime(u.criadoEm)}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditando(u)}>
                        Editar
                      </Button>
                      {u.id !== usuarioLogado?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => setExcluindo(u)}
                          className="text-bad-600 hover:bg-bad-50"
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      {modalNovo && (
        <FormularioUsuarioModal
          onClose={() => setModalNovo(false)}
          onSalvo={() => {
            setModalNovo(false);
            usuarios.reload();
          }}
        />
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            usuarios.reload();
          }}
        />
      )}

      {excluindo && (
        <Modal open onClose={() => setExcluindo(null)} title="Excluir usuário">
          <ExcluirUsuarioConfirm
            usuario={excluindo}
            onCancelar={() => setExcluindo(null)}
            onExcluido={() => {
              setExcluindo(null);
              usuarios.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function FormularioUsuarioModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("visualizador");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await authApi.criarUsuario({ nome: nome.trim(), email: email.trim(), senha, papel });
      onSalvo();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao criar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo usuário"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-usuario" loading={salvando}>
            Criar usuário
          </Button>
        </>
      }
    >
      <form id="form-novo-usuario" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label required>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </div>
        <div>
          <Label required>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label required hint="mínimo 8 caracteres">
            Senha inicial
          </Label>
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <Label>Permissão</Label>
          <Select value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            <option value="visualizador">Visualizador (somente leitura)</option>
            <option value="admin">Administrador (pode editar e excluir)</option>
          </Select>
        </div>
        <FieldError>{erro}</FieldError>
      </form>
    </Modal>
  );
}

function EditarUsuarioModal({
  usuario,
  onClose,
  onSalvo,
}: {
  usuario: Usuario;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { usuario: usuarioLogado } = useAuth();
  const [nome, setNome] = useState(usuario.nome);
  const [papel, setPapel] = useState<Papel>(usuario.papel);
  const [ativo, setAtivo] = useState(usuario.ativo);
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ehVoceMesmo = usuario.id === usuarioLogado?.id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha && novaSenha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      await authApi.atualizarUsuario(usuario.id, {
        nome: nome.trim(),
        papel,
        ativo,
        ...(novaSenha ? { senha: novaSenha } : {}),
      });
      onSalvo();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar ${usuario.nome}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="form-editar-usuario" loading={salvando}>
            Salvar alterações
          </Button>
        </>
      }
    >
      <form id="form-editar-usuario" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label required>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={usuario.email} disabled />
        </div>
        <div>
          <Label>Permissão</Label>
          <Select
            value={papel}
            onChange={(e) => setPapel(e.target.value as Papel)}
            disabled={ehVoceMesmo}
          >
            <option value="visualizador">Visualizador (somente leitura)</option>
            <option value="admin">Administrador (pode editar e excluir)</option>
          </Select>
          {ehVoceMesmo && (
            <p className="mt-1 text-xs text-ink-400">Você não pode alterar seu próprio papel.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="usuario-ativo"
            checked={ativo}
            disabled={ehVoceMesmo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
          />
          <label htmlFor="usuario-ativo" className="text-sm text-ink-700">
            Conta ativa (permite login)
          </label>
        </div>
        <div>
          <Label hint="deixe em branco para manter a atual">
            <span className="inline-flex items-center gap-1">
              <KeyRound size={12} /> Redefinir senha
            </span>
          </Label>
          <Input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="••••••••"
            minLength={8}
          />
        </div>
        <FieldError>{erro}</FieldError>
      </form>
    </Modal>
  );
}

function ExcluirUsuarioConfirm({
  usuario,
  onCancelar,
  onExcluido,
}: {
  usuario: Usuario;
  onCancelar: () => void;
  onExcluido: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    setErro(null);
    setExcluindo(true);
    try {
      await authApi.removerUsuario(usuario.id);
      onExcluido();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao excluir usuário.");
      setExcluindo(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Tem certeza que deseja excluir o acesso de <strong>{usuario.nome}</strong> ({usuario.email})? Esta
        ação não pode ser desfeita.
      </p>
      <FieldError>{erro}</FieldError>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancelar} type="button">
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleExcluir} loading={excluindo}>
          Excluir
        </Button>
      </div>
    </div>
  );
}

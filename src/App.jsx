import { useState } from 'react';
import DashboardLayout from './DashboardLayout';

const API_BASE = 'http://localhost:8000/api';

const getAuthToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
const getAuthHeaders = (extra = {}) => {
  const token = getAuthToken();
  const base = { 'Content-Type': 'application/json', ...extra };
  return token ? { Authorization: `Bearer ${token}`, ...base } : base;
};

const authFetch = (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const opts = { ...options, headers: getAuthHeaders(options.headers || {}) };
  return fetch(url, opts);
};

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [abaAtiva, setAbaAtiva] = useState('Agenda');

  const [formCadastro, setFormCadastro] = useState({ nome_completo: '', email: '', telefone: '', senha: '', tipo_conta: 'Prestador' });
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });

  // Portfólio & Agenda (Prestador)
  const [servicos, setServicos] = useState([]);
  const [formServico, setFormServico] = useState({ titulo: '', descricao: '', preco: '' });
  const [horariosPorDia, setHorariosPorDia] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState('Segunda');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [solicitacoesRecebidas, setSolicitacoesRecebidas] = useState([]);

  // Módulo Cliente
  const [todosServicos, setTodosServicos] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('09:00');

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Funções de Auxílio para Formatação
  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.toString().slice(0, 5);
  };

  const formatarData = (data) => {
    if (!data) return '';
    if (data.includes('T')) {
      const [ano, mes, dia] = data.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  };

  // Funções de Carregamento de Dados
  const carregarServicos = async (id) => {
    try {
      const res = await authFetch(`/servicos/${id}`);
      const dados = await res.json();
      setServicos(Array.isArray(dados) ? dados : []);
    } catch {
      console.error('Erro ao carregar serviços:');
      setServicos([]);
    }
  };

  const carregarAgenda = async (id) => {
    try {
      const res = await authFetch(`/agenda/${id}`);
      const dados = await res.json();
      setHorariosPorDia(dados?.horariosPorDia && Array.isArray(dados.horariosPorDia) ? dados.horariosPorDia : []);
    } catch {
      console.error('Erro ao carregar agenda:');
      setHorariosPorDia([]);
    }
  };

  const carregarSolicitacoesRecebidas = async (prestadorId) => {
    try {
      const res = await authFetch(`/agendamentos/prestador/${prestadorId}`);
      const dados = await res.json();
      setSolicitacoesRecebidas(Array.isArray(dados) ? dados : []);
    } catch {
      console.error('Erro ao carregar solicitações:');
      setSolicitacoesRecebidas([]);
    }
  };

  const carregarTodosServicos = async () => {
    try {
      const res = await authFetch('/servicos');
      const dados = await res.json();
      setTodosServicos(Array.isArray(dados) ? dados : []);
    } catch {
      console.error('Erro ao carregar todos os serviços:');
      setTodosServicos([]);
    }
  };

  const carregarMeusAgendamentos = async (id) => {
    try {
      const res = await authFetch(`/agendamentos/cliente/${id}`);
      const dados = await res.json();
      setMeusAgendamentos(Array.isArray(dados) ? dados : []);
    } catch {
      console.error('Erro ao carregar meus agendamentos:');
      setMeusAgendamentos([]);
    }
  };

  // Handlers Autenticação
  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formCadastro, tipo_conta: (formCadastro.tipo_conta || '').toUpperCase() };
      const res = await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const dados = await res.json();
      alert(dados?.mensagem || dados?.erro || 'Operação realizada.');
      if (res.ok) setTelaAtual('login');
    } catch {
      alert('Erro no servidor.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formLogin)
      });
      const dados = await res.json();

      if (res.ok) {
        // store token for subsequent requests
        if (dados.access_token) localStorage.setItem('access_token', dados.access_token);
        // normalize id field (backend may return id_usuario)
        const u = { ...(dados.usuario || {}) };
        if (!u.id && u.id_usuario) u.id = u.id_usuario;
        setUsuarioLogado(u);
        try { localStorage.setItem('usuario', JSON.stringify(u)); } catch (err) { console.error('Failed to persist user', err); }
        setTelaAtual('dashboard');

        if (u.tipo_conta === 'Prestador') {
          carregarServicos(u.id);
          carregarAgenda(u.id);
          carregarSolicitacoesRecebidas(u.id);
        } else {
          carregarTodosServicos();
          carregarMeusAgendamentos(u.id);
        }
      } else {
        alert(dados?.mensagem || dados?.erro || 'Falha ao realizar login.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    }
  };

  // Handlers Prestador
  
  const handleAtualizarStatusAgendamento = async (id, novoStatus) => {
    try {
      const res = await fetch(`${API_BASE}/agendamentos/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: novoStatus })
      });
      const dados = await res.json();
      alert(dados?.mensagem || dados?.erro || 'Status atualizado.');
      carregarSolicitacoesRecebidas(usuarioLogado.id);
    } catch {
      alert('Erro ao atualizar status.');
    }
  };

  const handleCadastrarServico = async (e) => {
    e.preventDefault();

    const precoConvertido = parseFloat(formServico.preco);
    if (isNaN(precoConvertido)) {
      return alert('Por favor, informe um preço válido.');
    }

    try {
      const res = await fetch(`${API_BASE}/servicos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formServico,
          preco: precoConvertido,
          prestadorId: parseInt(usuarioLogado.id, 10)
        })
      });

      const dados = await res.json();
      if (res.ok) {
        setFormServico({ titulo: '', descricao: '', preco: '' });
        carregarServicos(usuarioLogado.id);
      } else {
        alert(dados?.mensagem || dados?.erro || 'Erro ao cadastrar serviço.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    }
  };

  const handleDeletarServico = async (id) => {
    try {
      await fetch(`${API_BASE}/servicos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      carregarServicos(usuarioLogado.id);
    } catch {
      alert('Erro ao excluir serviço.');
    }
  };

  const handleSalvarHorarioDia = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/agenda`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prestadorId: usuarioLogado.id, dia: diaSelecionado, horaInicio, horaFim })
      });
      const dados = await res.json();
      alert(dados?.mensagem || dados?.erro || 'Horário salvo.');
      carregarAgenda(usuarioLogado.id);
    } catch {
      alert('Erro ao salvar horário.');
    }
  };

  const handleRemoverDia = async (dia) => {
    if (!dia) return alert('Dia inválido para exclusão.');
    try {
      const res = await fetch(`${API_BASE}/agenda/${usuarioLogado.id}/${encodeURIComponent(dia)}`, { method: 'DELETE', headers: getAuthHeaders() });
      const dados = await res.json();
      if (res.ok) {
        carregarAgenda(usuarioLogado.id);
      } else {
        alert(dados?.erro || dados?.mensagem || 'Erro ao remover dia da agenda.');
      }
    } catch {
      alert('Erro ao remover dia da agenda.');
    }
  };

  const handleSolicitarAgendamento = async (e) => {
    e.preventDefault();
    if (!servicoSelecionado) return alert('Selecione um serviço primeiro.');
    if (!dataAgendamento || !horaAgendamento) return alert('Informe a data e o horário.');

    const clienteId = parseInt(usuarioLogado?.id || usuarioLogado?.id_usuario, 10);
    const servicoId = parseInt(servicoSelecionado?.id || servicoSelecionado?.id_servico, 10);
    const prestadorId = parseInt(
      servicoSelecionado?.prestadorId || 
      servicoSelecionado?.prestador_id || 
      servicoSelecionado?.usuario_id, 
      10
    );

    if (isNaN(clienteId) || isNaN(servicoId) || isNaN(prestadorId)) {
      return alert(`Aviso: Um dos IDs está indefinido.
  Cliente: ${clienteId} | Serviço: ${servicoId} | Prestador: ${prestadorId}`);
    }

    try {
      const res = await fetch(`${API_BASE}/agendamentos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          clienteId,
          servicoId,
          prestadorId,
          data: dataAgendamento,
          hora: horaAgendamento
        })
      });

      const dados = await res.json();

      if (res.ok) {
        alert(dados?.mensagem || 'Solicitação de agendamento enviada com sucesso!');
        setServicoSelecionado(null);
        setDataAgendamento('');
        carregarMeusAgendamentos(clienteId);
      } else {
        alert(dados?.erro || dados?.mensagem || 'Erro ao processar solicitação.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    }
  };

  // TELAS DE AUTENTICAÇÃO
  const handleLogout = async () => {
    try {
      await authFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('access_token');
    setUsuarioLogado(null);
    setTelaAtual('login');
  };

  if (telaAtual === 'login') {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0E5A36', marginTop: 0 }}>Entrar no Painel</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input placeholder="E-mail" type="email" onChange={e => setFormLogin({ ...formLogin, email: e.target.value })} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input placeholder="Senha" type="password" onChange={e => setFormLogin({ ...formLogin, senha: e.target.value })} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#0E5A36', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
        </form>
        <p style={{ cursor: 'pointer', color: '#0E5A36', marginTop: '15px', textAlign: 'center' }} onClick={() => setTelaAtual('cadastro')}>Não tem conta? Cadastre-se</p>
      </div>
    );
  }

  if (telaAtual === 'cadastro') {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0E5A36', marginTop: 0 }}>Criar Conta</h2>
        <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input placeholder="Nome Completo" onChange={e => setFormCadastro({ ...formCadastro, nome_completo: e.target.value })} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input placeholder="E-mail" type="email" onChange={e => setFormCadastro({ ...formCadastro, email: e.target.value })} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input placeholder="Telefone" onChange={e => setFormCadastro({ ...formCadastro, telefone: e.target.value })} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input placeholder="Senha" type="password" onChange={e => setFormCadastro({ ...formCadastro, senha: e.target.value })} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <select onChange={e => setFormCadastro({ ...formCadastro, tipo_conta: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
            <option value="Prestador">Prestador</option>
            <option value="Cliente">Cliente</option>
          </select>
          <button type="submit" style={{ padding: '12px', backgroundColor: '#0E5A36', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cadastrar</button>
        </form>
        <p style={{ cursor: 'pointer', color: '#0E5A36', marginTop: '15px', textAlign: 'center' }} onClick={() => setTelaAtual('login')}>Voltar ao Login</p>
      </div>
    );
  }

  // PAINEL DESKTOP
  return (
    <DashboardLayout activeMenu={abaAtiva} onSelectMenu={setAbaAtiva}>
      <div className="header-banner">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Olá, {usuarioLogado?.nome_completo}</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Tipo de conta: {usuarioLogado?.tipo_conta}</p>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      {/* PAINEL PRESTADOR */}
      {usuarioLogado?.tipo_conta === 'Prestador' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Agendamentos hoje</span>
              <h2 style={{ margin: '8px 0', fontSize: '1.8rem' }}>{solicitacoesRecebidas.filter(s => s.status === 'Confirmado').length}</h2>
            </div>
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Solicitações Pendentes</span>
              <h2 style={{ margin: '8px 0', fontSize: '1.8rem', color: '#D97706' }}>{solicitacoesRecebidas.filter(s => s.status === 'Pendente').length}</h2>
            </div>
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Serviços Ativos</span>
              <h2 style={{ margin: '8px 0', fontSize: '1.8rem' }}>{servicos.length}</h2>
            </div>
          </div>

          {(abaAtiva === 'Agenda' || abaAtiva === 'Histórico') && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Próximos agendamentos & Solicitações</h3>
              {solicitacoesRecebidas.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Nenhuma solicitação de agendamento recebida.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                  {solicitacoesRecebidas.map((a) => (
                    <div key={a.id} style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', background: '#FAF9F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{a.nomeCliente || a.nome_cliente}</strong>
                        <span className={`status-badge ${(a.status || '').toLowerCase()}`}>{a.status}</span>
                      </div>
                      <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.tituloServico || a.titulo_servico} • R$ {a.precoServico || a.preco}</p>
                      <p style={{ margin: '4px 0 12px 0', fontSize: '0.9rem' }}>📅 {formatarData(a.data || a.data_agendamento)} às {formatarHora(a.hora || a.hora_agendamento)}</p>

                      {a.status === 'Pendente' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleAtualizarStatusAgendamento(a.id, 'Confirmado')} style={{ flex: 1, backgroundColor: 'var(--primary-green)', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ✓ Aceitar
                          </button>
                          <button onClick={() => handleAtualizarStatusAgendamento(a.id, 'Cancelado')} style={{ flex: 1, backgroundColor: 'transparent', color: '#9B1C1C', border: '1px solid #FDE8E8', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                            ✕ Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {(abaAtiva === 'Agenda' || abaAtiva === 'Perfil') && (
              <div className="card">
                <h3>Meu Portfólio (RF03)</h3>
                <form onSubmit={handleCadastrarServico} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <input placeholder="Título do Serviço" value={formServico.titulo} onChange={e => setFormServico({ ...formServico, titulo: e.target.value })} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <input placeholder="Descrição" value={formServico.descricao} onChange={e => setFormServico({ ...formServico, descricao: e.target.value })} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <input placeholder="Preço (R$)" type="number" value={formServico.preco} onChange={e => setFormServico({ ...formServico, preco: e.target.value })} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar Serviço</button>
                </form>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {servicos.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <div>
                        <strong>{s.titulo}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>R$ {s.preco}</div>
                      </div>
                      <button onClick={() => handleDeletarServico(s.id)} style={{ backgroundColor: 'transparent', color: 'red', border: 'none', cursor: 'pointer' }}>Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(abaAtiva === 'Agenda' || abaAtiva === 'Perfil') && (
              <div className="card">
                <h3>Dias de Atendimento (RF04)</h3>
                <form onSubmit={handleSalvarHorarioDia} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <select value={diaSelecionado} onChange={e => setDiaSelecionado(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    {diasDaSemana.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  </div>
                  <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Dia</button>
                </form>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {horariosPorDia.map((item, index) => {
                    const diaNome = item.dia || item.dia_semana;
                    const hInicio = item.horaInicio || item.hora_inicio;
                    const hFim = item.horaFim || item.hora_fim;

                    return (
                      <div key={item.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <span>
                          <strong>{diaNome}:</strong> {formatarHora(hInicio)} às {formatarHora(hFim)}
                        </span>
                        <button 
                          onClick={() => handleRemoverDia(diaNome)} 
                          style={{ backgroundColor: 'transparent', color: 'red', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAINEL CLIENTE */}
      {usuarioLogado?.tipo_conta === 'Cliente' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {(abaAtiva === 'Agenda' || abaAtiva === 'Perfil') && (
            <div className="card">
              <h3>Serviços Disponíveis (RF05)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {todosServicos.map(s => (
                  <div key={s.id} style={{ border: servicoSelecionado?.id === s.id ? '2px solid var(--primary-green)' : '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', background: servicoSelecionado?.id === s.id ? '#E2ECE6' : '#fff' }}>
                    <h4 style={{ margin: '0 0 6px 0' }}>{s.titulo}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#555' }}>{s.descricao}</p>
                    <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>R$ {s.preco}</p>
                    <button onClick={() => setServicoSelecionado(s)} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      {servicoSelecionado?.id === s.id ? 'Selecionado' : 'Agendar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {servicoSelecionado && (abaAtiva === 'Agenda' || abaAtiva === 'Perfil') && (
            <div className="card" style={{ border: '1px solid var(--primary-green)' }}>
              <h3>Agendar: {servicoSelecionado.titulo}</h3>
              <form onSubmit={handleSolicitarAgendamento} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Data</label>
                  <input type="date" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Horário</label>
                  <input type="time" value={horaAgendamento} onChange={e => setHoraAgendamento(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Enviar Solicitação
                </button>
              </form>
            </div>
          )}

          {(abaAtiva === 'Agenda' || abaAtiva === 'Histórico') && (
            <div className="card">
              <h3>Histórico de Agendamentos</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Serviço</th>
                    <th>Prestador</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meusAgendamentos.map(a => {
                    const dataFormatada = formatarData(a.data || a.data_agendamento);
                    const horaFormatada = formatarHora(a.hora || a.hora_agendamento);

                    return (
                      <tr key={a.id}>
                        <td>{dataFormatada} às {horaFormatada}</td>
                        <td>{a.tituloServico || a.titulo_servico}</td>
                        <td>{a.nomePrestador || a.nome_prestador}</td>
                        <td><span className={`status-badge ${(a.status || '').toLowerCase()}`}>{a.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
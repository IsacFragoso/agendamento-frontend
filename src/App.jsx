import { useState } from 'react';
import DashboardLayout from './DashboardLayout';

const API_BASE = 'http://localhost:8000/api';

const apiFetch = (path, options = {}, token = null) => fetch(`${API_BASE}${path}`, {
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }
});

const jsonOrEmpty = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [token, setToken] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('Agenda');

  const [formCadastro, setFormCadastro] = useState({ nome_completo: '', email: '', telefone: '', senha: '', tipo_conta: 'PRESTADOR' });
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });

  // Portfólio & Agenda (Prestador)
  const [servicos, setServicos] = useState([]);
  const [formServico, setFormServico] = useState({ titulo: '', descricao: '', preco: '', duracao_padrao: '60', id_categoria: '' });
  const [categorias, setCategorias] = useState([]);
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
    const texto = hora.toString();
    return texto.includes('T') ? texto.split('T')[1].slice(0, 5) : texto.slice(0, 5);
  };

  const formatarData = (data) => {
    if (!data) return '';
    if (data.includes('T')) {
      const [ano, mes, dia] = data.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  };

  const calcularFimAgendamento = (data, hora, duracao) => {
    const inicio = new Date(`${data}T${hora}:00`);
    inicio.setMinutes(inicio.getMinutes() + Number(duracao || 60));
    return inicio.toISOString();
  };

  // Funções de Carregamento de Dados
  const carregarServicos = async (id) => {
    try {
      const res = await apiFetch(`/servicos/prestador/${id}`);
      const dados = await jsonOrEmpty(res);
      setServicos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error('Erro ao carregar serviços:', e);
      setServicos([]);
    }
  };

  const carregarAgenda = async (id) => {
    try {
      const res = await apiFetch(`/prestadores/${id}/horario`);
      const dados = await jsonOrEmpty(res);
      setHorariosPorDia(dados?.dias_atendimento ? [{ dia: dados.dias_atendimento, hora_inicio: dados.horario_inicio, hora_fim: dados.horario_fim }] : []);
    } catch (e) {
      console.error('Erro ao carregar agenda:', e);
      setHorariosPorDia([]);
    }
  };

  const carregarSolicitacoesRecebidas = async (prestadorId, authToken = token) => {
    try {
      const res = await apiFetch('/agendamentos', {}, authToken);
      const dados = await jsonOrEmpty(res);
      setSolicitacoesRecebidas(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error('Erro ao carregar solicitações:', e);
      setSolicitacoesRecebidas([]);
    }
  };

  const carregarTodosServicos = async () => {
    try {
      const res = await apiFetch('/servicos');
      const dados = await jsonOrEmpty(res);
      setTodosServicos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error('Erro ao carregar todos os serviços:', e);
      setTodosServicos([]);
    }
  };

  const carregarMeusAgendamentos = async (id, authToken = token) => {
    try {
      const res = await apiFetch('/agendamentos', {}, authToken);
      const dados = await jsonOrEmpty(res);
      setMeusAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error('Erro ao carregar meus agendamentos:', e);
      setMeusAgendamentos([]);
    }
  };

  // Handlers Autenticação
  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCadastro)
      });
      const dados = await jsonOrEmpty(res);
      alert(dados?.mensagem || dados?.erro || 'Operação realizada.');
      if (res.ok) setTelaAtual('login');
    } catch {
      alert('Erro no servidor.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formLogin)
      });
      const dados = await jsonOrEmpty(res);

      if (res.ok) {
        const usuario = { ...dados.usuario, id: dados.usuario.id_usuario, tipo_conta: dados.usuario.tipo_conta.toUpperCase() };
        setToken(dados.access_token);
        setUsuarioLogado(usuario);
        setTelaAtual('dashboard');
        const categoriasRes = await apiFetch('/categorias');
        setCategorias(await jsonOrEmpty(categoriasRes));

        if (usuario.tipo_conta === 'PRESTADOR') {
          carregarServicos(usuario.id);
          carregarAgenda(usuario.id);
          carregarSolicitacoesRecebidas(usuario.id, dados.access_token);
        } else {
          carregarTodosServicos();
          carregarMeusAgendamentos(usuario.id, dados.access_token);
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
      const res = await apiFetch(`/agendamentos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus.toUpperCase() })
      }, token);
      const dados = await jsonOrEmpty(res);
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
      const res = await apiFetch('/servicos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: formServico.titulo,
          descricao: formServico.descricao,
          preco: precoConvertido,
          duracao_padrao: parseInt(formServico.duracao_padrao, 10),
          id_prestador: parseInt(usuarioLogado.id, 10),
          id_categoria: parseInt(formServico.id_categoria, 10)
        })
      }, token);

      const dados = await jsonOrEmpty(res);
      if (res.ok) {
        setFormServico({ titulo: '', descricao: '', preco: '', duracao_padrao: '60', id_categoria: '' });
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
      await apiFetch(`/servicos/${id}`, { method: 'DELETE' }, token);
      carregarServicos(usuarioLogado.id);
    } catch {
      alert('Erro ao excluir serviço.');
    }
  };

  const handleSalvarHorarioDia = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/prestadores/${usuarioLogado.id}/horario`, {
        method: 'PUT',
        body: JSON.stringify({ dias_atendimento: diaSelecionado, horario_inicio: horaInicio, horario_fim: horaFim })
      }, token);
      const dados = await jsonOrEmpty(res);
      alert(dados?.mensagem || dados?.erro || 'Horário salvo.');
      carregarAgenda(usuarioLogado.id);
    } catch {
      alert('Erro ao salvar horário.');
    }
  };

  const handleRemoverDia = async (dia) => {
    if (!dia) return alert('Dia inválido para exclusão.');
    try {
      const res = await apiFetch(`/prestadores/${usuarioLogado.id}/horario`, { method: 'DELETE' }, token);
      const dados = await jsonOrEmpty(res);
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
    if (isNaN(clienteId) || isNaN(servicoId)) {
      return alert(`Aviso: Um dos IDs está indefinido.
  Cliente: ${clienteId} | Serviço: ${servicoId}`);
    }

    try {
      const res = await apiFetch('/agendamentos', {
        method: 'POST',
        body: JSON.stringify({
          id_cliente: clienteId,
          id_servico: servicoId,
          data_hora_inicio: new Date(`${dataAgendamento}T${horaAgendamento}:00`).toISOString(),
          data_hora_fim: calcularFimAgendamento(dataAgendamento, horaAgendamento, servicoSelecionado.duracao_padrao)
        })
      }, token);

      const dados = await jsonOrEmpty(res);

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
          <select value={formCadastro.tipo_conta} onChange={e => setFormCadastro({ ...formCadastro, tipo_conta: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
            <option value="PRESTADOR">Prestador</option>
            <option value="CLIENTE">Cliente</option>
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
        <button onClick={() => { setUsuarioLogado(null); setTelaAtual('login'); }} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      {/* PAINEL PRESTADOR */}
      {usuarioLogado?.tipo_conta === 'PRESTADOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Agendamentos hoje</span>
              <h2 style={{ margin: '8px 0', fontSize: '1.8rem' }}>{solicitacoesRecebidas.filter(s => s.status === 'CONFIRMADO').length}</h2>
            </div>
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Solicitações Pendentes</span>
              <h2 style={{ margin: '8px 0', fontSize: '1.8rem', color: '#D97706' }}>{solicitacoesRecebidas.filter(s => s.status === 'PENDENTE').length}</h2>
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
                        <strong>{a.cliente?.nome_completo || 'Cliente'}</strong>
                        <span className={`status-badge ${(a.status || '').toLowerCase()}`}>{a.status}</span>
                      </div>
                      <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.servico?.titulo} • R$ {a.servico?.preco}</p>
                      <p style={{ margin: '4px 0 12px 0', fontSize: '0.9rem' }}>📅 {formatarData(a.data_hora_inicio)} às {formatarHora(a.data_hora_inicio)}</p>

                      {a.status === 'PENDENTE' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleAtualizarStatusAgendamento(a.id_agendamento, 'CONFIRMADO')} style={{ flex: 1, backgroundColor: 'var(--primary-green)', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ✓ Aceitar
                          </button>
                          <button onClick={() => handleAtualizarStatusAgendamento(a.id_agendamento, 'CANCELADO')} style={{ flex: 1, backgroundColor: 'transparent', color: '#9B1C1C', border: '1px solid #FDE8E8', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
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
                  <input placeholder="Duração (minutos)" type="number" min="1" value={formServico.duracao_padrao} onChange={e => setFormServico({ ...formServico, duracao_padrao: e.target.value })} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <select value={formServico.id_categoria} onChange={e => setFormServico({ ...formServico, id_categoria: e.target.value })} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(categoria => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nome}</option>)}
                  </select>
                  <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar Serviço</button>
                </form>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {servicos.map(s => (
                    <div key={s.id_servico} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <div>
                        <strong>{s.titulo}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>R$ {s.preco}</div>
                      </div>
                      <button onClick={() => handleDeletarServico(s.id_servico)} style={{ backgroundColor: 'transparent', color: 'red', border: 'none', cursor: 'pointer' }}>Excluir</button>
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
      {usuarioLogado?.tipo_conta === 'CLIENTE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {(abaAtiva === 'Agenda' || abaAtiva === 'Perfil') && (
            <div className="card">
              <h3>Serviços Disponíveis (RF05)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {todosServicos.map(s => (
                  <div key={s.id_servico} style={{ border: servicoSelecionado?.id_servico === s.id_servico ? '2px solid var(--primary-green)' : '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', background: servicoSelecionado?.id_servico === s.id_servico ? '#E2ECE6' : '#fff' }}>
                    <h4 style={{ margin: '0 0 6px 0' }}>{s.titulo}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#555' }}>{s.descricao}</p>
                    <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>R$ {s.preco}</p>
                    <button onClick={() => setServicoSelecionado(s)} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      {servicoSelecionado?.id_servico === s.id_servico ? 'Selecionado' : 'Agendar'}
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
                    const dataFormatada = formatarData(a.data_hora_inicio);
                    const horaFormatada = formatarHora(a.data_hora_inicio);

                    return (
                      <tr key={a.id_agendamento}>
                        <td>{dataFormatada} às {horaFormatada}</td>
                        <td>{a.servico?.titulo}</td>
                        <td>{a.prestador?.usuario?.nome_completo || a.prestador?.id_prestador}</td>
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
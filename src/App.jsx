import { useState, useEffect } from 'react';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  
  const [formCadastro, setFormCadastro] = useState({ nome_completo: '', email: '', telefone: '', senha: '', tipo_conta: 'Prestador' });
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  
  // RF03 - Portfólio (Prestador)
  const [servicos, setServicos] = useState([]);
  const [formServico, setFormServico] = useState({ titulo: '', descricao: '', preco: '' });

  // RF04 - Agenda (Prestador)
  const [horariosPorDia, setHorariosPorDia] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState('Segunda');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

  // RF06 - Solicitações do Prestador
  const [solicitacoesRecebidas, setSolicitacoesRecebidas] = useState([]);

  // RF05 - Módulo Cliente
  const [todosServicos, setTodosServicos] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('09:00');

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCadastro)
      });
      const dados = await res.json();
      alert(dados.mensagem);
      setTelaAtual('login');
    } catch (e) { alert('Erro no servidor.'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formLogin)
      });
      const dados = await res.json();
      
      if (res.ok) {
        setUsuarioLogado(dados.usuario);
        setTelaAtual('dashboard');

        if (dados.usuario.tipo_conta === 'Prestador') {
          carregarServicos(dados.usuario.id);
          carregarAgenda(dados.usuario.id);
          carregarSolicitacoesRecebidas(dados.usuario.id);
        } else {
          carregarTodosServicos();
          carregarMeusAgendamentos(dados.usuario.id);
        }
      } else { alert(dados.mensagem); }
    } catch (e) { alert('Erro ao conectar.'); }
  };

  // Funções Prestador
  const carregarServicos = async (id) => {
    const res = await fetch(`http://localhost:8000/servicos/${id}`);
    setServicos(await res.json());
  };

  const carregarAgenda = async (id) => {
    const res = await fetch(`http://localhost:8000/agenda/${id}`);
    const dados = await res.json();
    if (dados?.horariosPorDia) setHorariosPorDia(dados.horariosPorDia);
  };

  const carregarSolicitacoesRecebidas = async (prestadorId) => {
    try {
      const res = await fetch(`http://localhost:8000/agendamentos/prestador/${prestadorId}`);
      setSolicitacoesRecebidas(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAtualizarStatusAgendamento = async (id, novoStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/agendamentos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      const dados = await res.json();
      alert(dados.mensagem);
      carregarSolicitacoesRecebidas(usuarioLogado.id);
    } catch (e) { alert('Erro ao atualizar status.'); }
  };

  const handleCadastrarServico = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/servicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formServico, prestadorId: usuarioLogado.id })
    });
    if (res.ok) {
      setFormServico({ titulo: '', descricao: '', preco: '' });
      carregarServicos(usuarioLogado.id);
    }
  };

  const handleDeletarServico = async (id) => {
    await fetch(`http://localhost:8000/servicos/${id}`, { method: 'DELETE' });
    carregarServicos(usuarioLogado.id);
  };

  const handleSalvarHorarioDia = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestadorId: usuarioLogado.id, dia: diaSelecionado, horaInicio, horaFim })
    });
    const dados = await res.json();
    alert(dados.mensagem);
    carregarAgenda(usuarioLogado.id);
  };

  const handleRemoverDia = async (dia) => {
    await fetch(`http://localhost:8000/agenda/${usuarioLogado.id}/${dia}`, { method: 'DELETE' });
    carregarAgenda(usuarioLogado.id);
  };

  // Funções Cliente
  const carregarTodosServicos = async () => {
    const res = await fetch('http://localhost:8000/servicos');
    setTodosServicos(await res.json());
  };

  const carregarMeusAgendamentos = async (id) => {
    const res = await fetch(`http://localhost:8000/agendamentos/cliente/${id}`);
    setMeusAgendamentos(await res.json());
  };

  const handleSolicitarAgendamento = async (e) => {
    e.preventDefault();
    if (!servicoSelecionado) return alert('Selecione um serviço.');

    const res = await fetch('http://localhost:8000/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: usuarioLogado.id,
        servicoId: servicoSelecionado.id,
        prestadorId: servicoSelecionado.prestadorId,
        data: dataAgendamento,
        hora: horaAgendamento
      })
    });

    const dados = await res.json();
    alert(dados.mensagem);
    setServicoSelecionado(null);
    setDataAgendamento('');
    carregarMeusAgendamentos(usuarioLogado.id);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {telaAtual === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2>Entrar (RF02)</h2>
          <input placeholder="E-mail" type="email" onChange={e => setFormLogin({...formLogin, email: e.target.value})} required />
          <input placeholder="Senha" type="password" onChange={e => setFormLogin({...formLogin, senha: e.target.value})} required />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>Entrar</button>
          <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setTelaAtual('cadastro')}>Não tem conta? Cadastre-se</p>
        </form>
      )}

      {telaAtual === 'cadastro' && (
        <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2>Criar Conta (RF01)</h2>
          <input placeholder="Nome Completo" onChange={e => setFormCadastro({...formCadastro, nome_completo: e.target.value})} required />
          <input placeholder="E-mail" type="email" onChange={e => setFormCadastro({...formCadastro, email: e.target.value})} required />
          <input placeholder="Telefone" onChange={e => setFormCadastro({...formCadastro, telefone: e.target.value})} required />
          <input placeholder="Senha" type="password" onChange={e => setFormCadastro({...formCadastro, senha: e.target.value})} required />
          <select onChange={e => setFormCadastro({...formCadastro, tipo_conta: e.target.value})}>
            <option value="Prestador">Prestador</option>
            <option value="Cliente">Cliente</option>
          </select>
          <button type="submit" style={{ padding: '10px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>Cadastrar</button>
          <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setTelaAtual('login')}>Voltar ao Login</p>
        </form>
      )}

      {telaAtual === 'dashboard' && usuarioLogado && (
        <div>
          <h2>Painel do {usuarioLogado.tipo_conta}</h2>
          <p>Usuário: <strong>{usuarioLogado.nome_completo}</strong></p>
          <button onClick={() => setTelaAtual('login')} style={{ marginBottom: '20px' }}>Sair</button>

          {/* PAINEL DO PRESTADOR */}
          {usuarioLogado.tipo_conta === 'Prestador' && (
            <div>
              {/* RF06: GERENCIAMENTO DE SOLICITAÇÕES */}
              <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px', marginBottom: '30px' }}>
                <h3>Solicitações de Agendamento Recebidas (RF06)</h3>
                {solicitacoesRecebidas.length === 0 ? <p>Nenhuma solicitação de agendamento recebida.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {solicitacoesRecebidas.map(a => (
                      <li key={a.id} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#fdfdfd' }}>
                        <p style={{ margin: '0 0 5px 0' }}><strong>Serviço:</strong> {a.tituloServico} (R$ {a.precoServico})</p>
                        <p style={{ margin: '0 0 5px 0' }}><strong>Cliente:</strong> {a.nomeCliente}</p>
                        <p style={{ margin: '0 0 5px 0' }}><strong>Data/Hora:</strong> {a.data} às {a.hora}</p>
                        <p style={{ margin: '0 0 10px 0' }}><strong>Status Atual:</strong> <span style={{ fontWeight: 'bold', color: a.status === 'Confirmado' ? 'green' : a.status === 'Cancelado' ? 'red' : 'orange' }}>{a.status}</span></p>

                        {a.status === 'Pendente' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleAtualizarStatusAgendamento(a.id, 'Confirmado')} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>
                              Aceitar Agendamento
                            </button>
                            <button onClick={() => handleAtualizarStatusAgendamento(a.id, 'Cancelado')} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>
                              Recusar Agendamento
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* RF03: PORTFÓLIO */}
              <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px', marginBottom: '30px' }}>
                <h3>Meu Portfólio (RF03)</h3>
                <form onSubmit={handleCadastrarServico} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <input placeholder="Título do Serviço" value={formServico.titulo} onChange={e => setFormServico({...formServico, titulo: e.target.value})} required />
                  <input placeholder="Descrição" value={formServico.descricao} onChange={e => setFormServico({...formServico, descricao: e.target.value})} required />
                  <input placeholder="Preço (R$)" type="number" value={formServico.preco} onChange={e => setFormServico({...formServico, preco: e.target.value})} required />
                  <button type="submit" style={{ padding: '8px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>Adicionar Serviço</button>
                </form>

                <h4>Serviços Cadastrados</h4>
                {servicos.length === 0 ? <p>Nenhum serviço cadastrado.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {servicos.map(s => (
                      <li key={s.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
                        <strong>{s.titulo}</strong> - R$ {s.preco}
                        <p style={{ margin: '5px 0' }}>{s.descricao}</p>
                        <button onClick={() => handleDeletarServico(s.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px', cursor: 'pointer' }}>Remover</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* RF04: AGENDA */}
              <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>Horários Customizados por Dia (RF04)</h3>
                <form onSubmit={handleSalvarHorarioDia} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label><strong>Dia:</strong></label>
                    <select value={diaSelecionado} onChange={e => setDiaSelecionado(e.target.value)} style={{ padding: '5px' }}>
                      {diasDaSemana.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div><label><strong>Início:</strong> </label><input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required /></div>
                    <div><label><strong>Fim:</strong> </label><input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} required /></div>
                  </div>
                  <button type="submit" style={{ padding: '8px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>Salvar Horário</button>
                </form>

                <h4>Agenda Semanal Configurada</h4>
                {horariosPorDia.length === 0 ? <p>Nenhum dia configurado.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {horariosPorDia.map(item => (
                      <li key={item.dia} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{item.dia}:</strong> {item.horaInicio} às {item.horaFim}</div>
                        <button onClick={() => handleRemoverDia(item.dia)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px', cursor: 'pointer' }}>Excluir</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* PAINEL DO CLIENTE */}
          {usuarioLogado.tipo_conta === 'Cliente' && (
            <div>
              <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px', marginBottom: '30px' }}>
                <h3>Serviços Disponíveis (RF05)</h3>
                {todosServicos.length === 0 ? <p>Nenhum serviço disponível no momento.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {todosServicos.map(s => (
                      <div key={s.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '6px', backgroundColor: servicoSelecionado?.id === s.id ? '#e8f5e9' : '#fff' }}>
                        <h4>{s.titulo} - R$ {s.preco}</h4>
                        <p style={{ margin: '5px 0' }}>{s.descricao}</p>
                        <p style={{ fontSize: '0.9em', color: '#555' }}>Prestador: <strong>{s.nomePrestador}</strong></p>
                        <button onClick={() => setServicoSelecionado(s)} style={{ padding: '6px 12px', backgroundColor: servicoSelecionado?.id === s.id ? '#2e7d32' : '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>
                          {servicoSelecionado?.id === s.id ? 'Selecionado' : 'Agendar Este Serviço'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {servicoSelecionado && (
                <div style={{ border: '1px solid #008C4A', padding: '15px', borderRadius: '6px', marginBottom: '30px', backgroundColor: '#f9f9f9' }}>
                  <h4>Confirmar Horário para: {servicoSelecionado.titulo}</h4>
                  <form onSubmit={handleSolicitarAgendamento} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label>Data: </label>
                      <input type="date" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} required />
                    </div>
                    <div>
                      <label>Horário: </label>
                      <input type="time" value={horaAgendamento} onChange={e => setHoraAgendamento(e.target.value)} required />
                    </div>
                    <button type="submit" style={{ padding: '8px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>
                      Enviar Solicitação de Agendamento
                    </button>
                  </form>
                </div>
              )}

              <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>Meus Agendamentos</h3>
                {meusAgendamentos.length === 0 ? <p>Você ainda não possui agendamentos.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {meusAgendamentos.map(a => (
                      <li key={a.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
                        <strong>{a.tituloServico}</strong> com {a.nomePrestador}
                        <p style={{ margin: '5px 0' }}>Data: {a.data} às {a.hora}</p>
                        <p style={{ margin: '0', fontSize: '0.9em' }}>Status: <strong style={{ color: a.status === 'Confirmado' ? 'green' : a.status === 'Cancelado' ? 'red' : 'orange' }}>{a.status}</strong></p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default App;
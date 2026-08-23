import { useState, useEffect } from 'react';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  
  const [formCadastro, setFormCadastro] = useState({ nome_completo: '', email: '', telefone: '', senha: '', tipo_conta: 'Prestador' });
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  
  // RF03 - Portfólio
  const [servicos, setServicos] = useState([]);
  const [formServico, setFormServico] = useState({ titulo: '', descricao: '', preco: '' });

  // RF04 - Agenda Individual por Dia
  const [horariosPorDia, setHorariosPorDia] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState('Segunda');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

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
    } catch (e) {
      alert('Erro no servidor.');
    }
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
        carregarServicos(dados.usuario.id);
        carregarAgenda(dados.usuario.id);
      } else {
        alert(dados.mensagem);
      }
    } catch (e) {
      alert('Erro ao tentar conectar.');
    }
  };

  // RF03 - Portfólio
  const carregarServicos = async (prestadorId) => {
    try {
      const res = await fetch(`http://localhost:8000/servicos/${prestadorId}`);
      const dados = await res.json();
      setServicos(dados);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCadastrarServico = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formServico, prestadorId: usuarioLogado.id })
      });
      if (res.ok) {
        setFormServico({ titulo: '', descricao: '', preco: '' });
        carregarServicos(usuarioLogado.id);
      }
    } catch (e) {
      alert('Erro ao cadastrar serviço.');
    }
  };

  const handleDeletarServico = async (id) => {
    try {
      await fetch(`http://localhost:8000/servicos/${id}`, { method: 'DELETE' });
      carregarServicos(usuarioLogado.id);
    } catch (e) {
      alert('Erro ao remover serviço.');
    }
  };

  // RF04 - Agenda por Dia
  const carregarAgenda = async (prestadorId) => {
    try {
      const res = await fetch(`http://localhost:8000/agenda/${prestadorId}`);
      const dados = await res.json();
      if (dados && dados.horariosPorDia) {
        setHorariosPorDia(dados.horariosPorDia);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSalvarHorarioDia = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestadorId: usuarioLogado.id,
          dia: diaSelecionado,
          horaInicio,
          horaFim
        })
      });
      const dados = await res.json();
      alert(dados.mensagem);
      carregarAgenda(usuarioLogado.id);
    } catch (e) {
      alert('Erro ao salvar horário.');
    }
  };

  const handleRemoverDia = async (dia) => {
    try {
      await fetch(`http://localhost:8000/agenda/${usuarioLogado.id}/${dia}`, { method: 'DELETE' });
      carregarAgenda(usuarioLogado.id);
    } catch (e) {
      alert('Erro ao remover horário.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
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

          {usuarioLogado.tipo_conta === 'Prestador' && (
            <div>
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
                {servicos.length === 0 ? <p>Nenhum serviço cadastrado ainda.</p> : (
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

              {/* RF04: AGENDA CUSTOMIZADA POR DIA */}
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
                    <div>
                      <label><strong>Início:</strong> </label>
                      <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required />
                    </div>
                    <div>
                      <label><strong>Fim:</strong> </label>
                      <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} required />
                    </div>
                  </div>

                  <button type="submit" style={{ padding: '8px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Salvar Horário para {diaSelecionado}
                  </button>
                </form>

                <h4>Agenda Semanal Configurada</h4>
                {horariosPorDia.length === 0 ? <p>Nenhum dia de atendimento configurado.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {horariosPorDia.map(item => (
                      <li key={item.dia} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{item.dia}:</strong> {item.horaInicio} às {item.horaFim}
                        </div>
                        <button onClick={() => handleRemoverDia(item.dia)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                          Excluir
                        </button>
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
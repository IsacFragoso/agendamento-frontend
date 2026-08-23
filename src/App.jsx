import { useState, useEffect } from 'react';

function App() {
  // Guarda os dados do formulário
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    senha: '',
    tipo_conta: 'Prestador'
  });

  // NOVO: Guarda a lista de usuários vindos do servidor
  const [usuarios, setUsuarios] = useState([]);

  // NOVO: Função que busca os usuários cadastrados
  const carregarUsuarios = async () => {
    try {
      const resposta = await fetch('http://localhost:8000/usuarios');
      const dados = await resposta.json();
      setUsuarios(dados); // Salva os dados na tela
    } catch (erro) {
      console.error("Erro ao buscar usuários", erro);
    }
  };

  // NOVO: Executa a busca assim que a tela abre
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const resposta = await fetch('http://localhost:8000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const dados = await resposta.json();
      alert(dados.mensagem); 
      
      // NOVO: Atualiza a lista visualmente na mesma hora!
      carregarUsuarios();
      
    } catch (erro) {
      alert('Erro ao tentar conectar com o servidor.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Criar conta</h2>
      <p>Acesse a plataforma gratuitamente</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
        <input name="nome_completo" placeholder="Ex: Marcos Pereira" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Ex: marcos@email.com" onChange={handleChange} required />
        <input name="telefone" placeholder="Ex: (18) 99999-0000" onChange={handleChange} required />
        <input name="senha" type="password" placeholder="Senha" onChange={handleChange} required />
        
        <label>Tipo de conta:</label>
        <select name="tipo_conta" onChange={handleChange} style={{ padding: '5px' }}>
          <option value="Prestador">Prestador - Ofereço serviços</option>
          <option value="Cliente">Cliente - Busco serviços</option>
        </select>
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#008C4A', color: 'white', border: 'none', cursor: 'pointer' }}>
          Criar conta
        </button>
      </form>

      <hr />

      {/* NOVO: Seção que exibe a lista de usuários */}
      <h2>Usuários Cadastrados</h2>
      {usuarios.length === 0 ? (
        <p>Nenhum usuário cadastrado ainda.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {usuarios.map((user) => (
            <li key={user.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
              <strong>{user.nome_completo}</strong> <br />
              Email: {user.email} <br />
              Tipo: {user.tipo_conta}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
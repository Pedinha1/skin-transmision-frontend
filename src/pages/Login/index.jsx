import React, { useState } from 'react';
import api from '../../services/apiClient'; // Import api directly for register
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--bg-primary);
`;

const LoginForm = styled.form`
  background-color: var(--bg-secondary);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #ccc;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #333;
  background-color: #2c2c2c;
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--accent-color);
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;

  &:hover {
    filter: brightness(1.1);
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
  text-decoration: underline;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #4caf50;
  margin-bottom: 1rem;
  text-align: center;
`;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isLogin) {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
      }
    } else {
      try {
        // Forçando role 'dj' no cadastro através desta tela
        await api.post('/auth/register', { 
          username, 
          email, 
          password,
          role: 'dj' 
        });
        setSuccess('Conta de DJ criada com sucesso! Faça login.');
        setIsLogin(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao criar conta');
      }
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>{isLogin ? 'Login DJ' : 'Criar Conta DJ'}</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        {!isLogin && (
          <InputGroup>
            <Label>Nome de Usuário</Label>
            <Input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
            />
          </InputGroup>
        )}
        
        <InputGroup>
          <Label>Email</Label>
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </InputGroup>
        <InputGroup>
          <Label>Senha</Label>
          <Input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </InputGroup>
        <Button type="submit">{isLogin ? 'Entrar' : 'Registrar DJ'}</Button>
        
        <ToggleButton type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça login'}
        </ToggleButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;

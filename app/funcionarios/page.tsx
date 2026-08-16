'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PagamentoFuncionario {
  id: number;
  nome_funcionario: string;
  funcao: string;
  valor_pago: number;
  criado_em: string;
}

export default function EquipePage() {
  const hoje = new Date();
  
  const [pagamentos, setPagamentos] = useState<PagamentoFuncionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados dos inputs de cadastro
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [funcao, setFuncao] = useState('');
  const [valorPagoInput, setValorPagoInput] = useState('');

  // Estados de Filtro (Dia, Mês, Ano e Funcionário)
  const [tipoFiltro, setTipoFiltro] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [valorFiltro, setValorFiltro] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  );
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('Todos');

  useEffect(() => {
    carregarPagamentos();
  }, []);

  const carregarPagamentos = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('pagamentos_funcionarios')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } else if (data) {
      setPagamentos(data);
    }
    setCarregando(false);
  };

  // Máscaras e Formatação de BRL
  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const aplicarMascaraMoeda = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return '';
    const valorNumerico = Number(apenasNumeros) / 100;
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const converterParaNumeroDecimal = (valorFormatado: string) => {
    if (!valorFormatado) return 0;
    const limpo = valorFormatado.replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

  const handleSalvarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFuncionario || !valorPagoInput) return;

    setSalvando(true);
    const dataAtualStr = new Date().toISOString();
    const valorNumerico = converterParaNumeroDecimal(valorPagoInput);

    const payload = {
      nome_funcionario: nomeFuncionario,
      funcao,
      valor_pago: valorNumerico,
      criado_em: dataAtualStr,
    };

    const { error } = await supabase.from('pagamentos_funcionarios').insert([payload]);

    if (error) {
      alert('Erro ao salvar pagamento: ' + error.message);
    } else {
      setNomeFuncionario('');
      setFuncao('');
      setValorPagoInput('');
      await carregarPagamentos();
    }
    setSalvando(false);
  };

  const excluirPagamento = async (id: number) => {
    if (!confirm('Deseja realmente excluir este pagamento?')) return;
    const { error } = await supabase.from('pagamentos_funcionarios').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      await carregarPagamentos();
    }
  };

  // Lista única de funcionários para o select de filtro
  const listaFuncionariosUnicos = ['Todos', ...Array.from(new Set(pagamentos.map((p) => p.nome_funcionario).filter(Boolean)))];

  // Filtragem dos pagamentos por Período e por Funcionário
  const pagamentosFiltrados = pagamentos.filter((item) => {
    const dataItem = item.criado_em ? item.criado_em.slice(0, 10) : '';
    
    // Filtro de Funcionário
    const matchFuncionario =
      funcionarioFiltro === 'Todos' ||
      item.nome_funcionario?.toLowerCase() === funcionarioFiltro.toLowerCase();

    // Filtro de Data
    let matchData = true;
    if (valorFiltro && dataItem) {
      if (tipoFiltro === 'dia') {
        matchData = dataItem === valorFiltro;
      } else if (tipoFiltro === 'mes') {
        matchData = dataItem.slice(0, 7) === valorFiltro;
      } else if (tipoFiltro === 'ano') {
        matchData = dataItem.slice(0, 4) === valorFiltro;
      }
    }

    return matchFuncionario && matchData;
  });

  // Totais do período filtrado
  const totalLancadoPeriodo = pagamentosFiltrados.reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);
  const totalGeralAbsoluto = pagamentos.reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pagamento de Funcionários</h1>
          <p className="text-slate-400 text-sm">Registro individual com data e hora de pagamento</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Funcionário */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg">
            <span className="text-xs text-slate-400 font-semibold">Funcionário:</span>
            <select
              value={funcionarioFiltro}
              onChange={(e) => setFuncionarioFiltro(e.target.value)}
              className="bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded p-1 outline-none focus:border-yellow-500 cursor-pointer"
            >
              {listaFuncionariosUnicos.map((func) => (
                <option key={func} value={func}>
                  {func}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Período (Dia, Mês, Ano) */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg">
            <span className="text-base">📅</span>
            <select
              value={tipoFiltro}
              onChange={(e) => {
                const novoTipo = e.target.value as 'dia' | 'mes' | 'ano';
                setTipoFiltro(novoTipo);
                if (novoTipo === 'dia') setValorFiltro(hoje.toISOString().split('T')[0]);
                if (novoTipo === 'mes') setValorFiltro(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
                if (novoTipo === 'ano') setValorFiltro(String(hoje.getFullYear()));
              }}
              className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded p-1 outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="dia">Dia</option>
              <option value="mes">Mês</option>
              <option value="ano">Ano</option>
            </select>

            {tipoFiltro === 'dia' && (
              <input
                type="date"
                value={valorFiltro}
                onChange={(e) => setValorFiltro(e.target.value)}
                className="bg-transparent text-sm font-semibold text-yellow-400 focus:outline-none scheme-dark cursor-pointer"
              />
            )}

            {tipoFiltro === 'mes' && (
              <input
                type="month"
                value={valorFiltro}
                onChange={(e) => setValorFiltro(e.target.value)}
                className="bg-transparent text-sm font-semibold text-yellow-400 focus:outline-none scheme-dark cursor-pointer"
              />
            )}

            {tipoFiltro === 'ano' && (
              <input
                type="number"
                min="2020"
                max="2099"
                value={valorFiltro}
                onChange={(e) => setValorFiltro(e.target.value)}
                className="bg-transparent text-sm font-semibold text-yellow-400 focus:outline-none w-20 text-center"
              />
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/80 p-5 rounded-xl border border-yellow-500/40 bg-gradient-to-br from-slate-800 to-yellow-950/20 shadow">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
            Total Lançado ({tipoFiltro.toUpperCase()} {funcionarioFiltro !== 'Todos' ? `- ${funcionarioFiltro}` : ''})
          </p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">{carregando ? '...' : formatarMoeda(totalLancadoPeriodo)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{pagamentosFiltrados.length} pagamento(s) no período</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Geral Absoluto</p>
          <p className="text-2xl font-bold text-white mt-2">{carregando ? '...' : formatarMoeda(totalGeralAbsoluto)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Acumulado de todos os registros</p>
        </div>
      </div>

      {/* Formulário para Lançar Pagamento */}
      <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow space-y-4">
        <h3 className="text-white font-bold text-base">Lançar Pagamento</h3>
        <form onSubmit={handleSalvarPagamento} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Funcionário</label>
            <input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={nomeFuncionario}
              onChange={(e) => setNomeFuncionario(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Cargo</label>
            <input
              type="text"
              placeholder="Ex: Eletricista"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Pago (R$)</label>
            <input
              type="text"
              required
              placeholder="0,00"
              value={valorPagoInput}
              onChange={(e) => setValorPagoInput(aplicarMascaraMoeda(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-semibold text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold p-2.5 rounded-lg text-sm transition shadow h-[42px]"
          >
            {salvando ? 'Salvando...' : 'Salvar Pagamento'}
          </button>
        </form>
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white text-base">Histórico de Pagamentos</h3>
          <span className="text-xs text-slate-400">{pagamentosFiltrados.length} registro(s) encontrado(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="p-3">Data e Hora</th>
                <th className="p-3">Funcionário</th>
                <th className="p-3">Função</th>
                <th className="p-3">Valor Pago</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm text-slate-200">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-400">Carregando dados...</td>
                </tr>
              ) : pagamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-400">Nenhum pagamento encontrado para este filtro.</td>
                </tr>
              ) : (
                pagamentosFiltrados.map((item) => {
                  let dataFormatada = item.criado_em;
                  try {
                    const d = new Date(item.criado_em);
                    dataFormatada = d.toLocaleString('pt-BR');
                  } catch {}

                  return (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition">
                      <td className="p-3 whitespace-nowrap text-slate-300">{dataFormatada}</td>
                      <td className="p-3 font-semibold text-white">{item.nome_funcionario}</td>
                      <td className="p-3 text-slate-300">{item.funcao || '-'}</td>
                      <td className="p-3 font-bold text-yellow-400">{formatarMoeda(item.valor_pago)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => excluirPagamento(item.id)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 rounded border border-rose-500/20 transition"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface RegistroFrota {
  id: number;
  veiculo?: string;
  motorista?: string;
  valor: number;
  criado_em: string;
  forma_pagamento?: string;
}

export default function FrotaPage() {
  const router = useRouter();
  const hoje = new Date();

  const [tipoFiltro, setTipoFiltro] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [valorFiltro, setValorFiltro] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  );

  const [registros, setRegistros] = useState<RegistroFrota[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [veiculo, setVeiculo] = useState('');
  const [motorista, setMotorista] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [dataGasto, setDataGasto] = useState(hoje.toISOString().split('T')[0]);

  useEffect(() => {
    carregarFrota();
  }, []);

  const carregarFrota = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('registros_frota')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar frota:', error);
    } else if (data) {
      setRegistros(data);
    }
    setCarregando(false);
  };

  const abrirEdicao = (item: RegistroFrota) => {
    setIdEdicao(item.id);
    setVeiculo(item.veiculo || '');
    setMotorista(item.motorista || '');
    setValor(item.valor.toString());
    setFormaPagamento(item.forma_pagamento || 'Pix');
    setDataGasto(item.criado_em || hoje.toISOString().split('T')[0]);
    setModalAberto(true);
  };

  const handleSalvarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !dataGasto) return;

    const payload = {
      veiculo,
      motorista,
      valor: Number(valor),
      forma_pagamento: formaPagamento,
      criado_em: dataGasto,
    };

    let error;
    if (idEdicao) {
      const res = await supabase.from('registros_frota').update(payload).eq('id', idEdicao);
      error = res.error;
    } else {
      const res = await supabase.from('registros_frota').insert([payload]);
      error = res.error;
    }

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setModalAberto(false);
      setIdEdicao(null);
      setVeiculo('');
      setMotorista('');
      setValor('');
      carregarFrota();
    }
  };

  const excluirRegistro = async (id: number) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    const { error } = await supabase.from('registros_frota').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarFrota();
    }
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Filtragem por período (Dia, Mês ou Ano)
  const registrosFiltrados = registros.filter((item) => {
    const dataItem = item.criado_em;
    if (!valorFiltro || !dataItem) return true;

    if (tipoFiltro === 'dia') {
      return dataItem.slice(0, 10) === valorFiltro;
    }
    if (tipoFiltro === 'mes') {
      return dataItem.slice(0, 7) === valorFiltro;
    }
    if (tipoFiltro === 'ano') {
      return dataItem.slice(0, 4) === valorFiltro;
    }
    return true;
  });

  // Totais Gerais e por Forma de Pagamento baseados no filtro selecionado
  const totalGeralPeriodo = registrosFiltrados.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalCartao = registrosFiltrados
    .filter((item) => item.forma_pagamento?.toLowerCase() === 'cartão')
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalPix = registrosFiltrados
    .filter((item) => item.forma_pagamento?.toLowerCase() === 'pix')
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalDinheiro = registrosFiltrados
    .filter((item) => item.forma_pagamento?.toLowerCase() === 'dinheiro')
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Acumulado geral absoluto de todos os tempos
  const totalGeralAbsoluto = registros.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho e Filtros de Período */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/80">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle de Frota & Despesas</h1>
          <p className="text-slate-400 text-sm">Gerenciamento de combustível, manutenções e pagamentos</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-inner">
            <span className="text-base">📅</span>
            <select
              value={tipoFiltro}
              onChange={(e) => {
                const novoTipo = e.target.value as 'dia' | 'mes' | 'ano';
                setTipoFiltro(novoTipo);
                if (novoTipo === 'dia') setValorFiltro(hoje.toISOString().split('T')[0]);
                if (novoTipo === 'mes') setValorFiltro(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
                if (novoTipo === 'ano') setValorFiltro(`${hoje.getFullYear()}`);
              }}
              className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded p-1 outline-none focus:border-yellow-500"
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

          <button
            onClick={() => {
              setIdEdicao(null);
              setVeiculo('');
              setMotorista('');
              setValor('');
              setFormaPagamento('Pix');
              setDataGasto(hoje.toISOString().split('T')[0]);
              setModalAberto(true);
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition shadow-md text-sm"
          >
            + Novo Gasto
          </button>
        </div>
      </div>

      {/* Cards de Resumo (FROTA & GERAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-yellow-500/40 bg-gradient-to-br from-slate-800 to-yellow-950/20 shadow">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Total Frota ({tipoFiltro.toUpperCase()})</p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">{carregando ? '...' : formatarMoeda(totalGeralPeriodo)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Filtrado por período</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-blue-500/40 shadow">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Geral Acumulado</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">{carregando ? '...' : formatarMoeda(totalGeralAbsoluto)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total geral absoluto</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-emerald-500/40 shadow">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">💳 Cartão ({tipoFiltro.toUpperCase()})</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{carregando ? '...' : formatarMoeda(totalCartao)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gastos no cartão</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-purple-500/40 shadow">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">📱 Pix ({tipoFiltro.toUpperCase()})</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">{carregando ? '...' : formatarMoeda(totalPix)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gastos via Pix</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-amber-500/40 shadow">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">💵 Dinheiro ({tipoFiltro.toUpperCase()})</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">{carregando ? '...' : formatarMoeda(totalDinheiro)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gastos em dinheiro</p>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white text-base">Histórico de Lançamentos</h3>
          <span className="text-xs text-slate-400">{registrosFiltrados.length} registro(s) encontrado(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="p-3">Data</th>
                <th className="p-3">Veículo</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm text-slate-200">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400">Carregando dados...</td>
                </tr>
              ) : registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400">Nenhum registro encontrado para este período.</td>
                </tr>
              ) : (
                registrosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 whitespace-nowrap text-slate-300">
                      {item.criado_em ? item.criado_em.slice(0, 10).split('-').reverse().join('/') : '-'}
                    </td>
                    <td className="p-3 font-semibold text-white">{item.veiculo || 'Não informado'}</td>
                    <td className="p-3 text-slate-300">{item.motorista || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-900 text-yellow-400 border border-slate-700">
                        {item.forma_pagamento || 'Pix'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-yellow-400">{formatarMoeda(item.valor)}</td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => abrirEdicao(item)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluirRegistro(item.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1 bg-rose-500/10 rounded border border-rose-500/20 transition"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {idEdicao ? 'Editar Gasto' : 'Adicionar Gasto de Frota'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarGasto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Veículo</label>
                <input
                  type="text"
                  placeholder="Ex: Fiat Strada - ABC-1234"
                  value={veiculo}
                  onChange={(e) => setVeiculo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motorista</label>
                <input
                  type="text"
                  placeholder="Nome do motorista"
                  value={motorista}
                  onChange={(e) => setMotorista(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={dataGasto}
                    onChange={(e) => setDataGasto(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 scheme-dark cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento *</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition shadow"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
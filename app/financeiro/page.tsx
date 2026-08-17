'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ItemFinanceiro {
  id: number;
  mes: string;
  receita: number;
  despesas: number;
  criado_em?: string;
}

export default function FinanceiroPage() {
  const [dadosFinanceiros, setDadosFinanceiros] = useState<ItemFinanceiro[]>([]);
  const [mesInput, setMesInput] = useState(() => new Date().toISOString().slice(0, 7));
  const [receitaInput, setReceitaInput] = useState('');
  const [despesasInput, setDespesasInput] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data } = await supabase.from('financeiro_mensal').select('*').order('id', { ascending: false });
    if (data) setDadosFinanceiros(data);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const formatarDataHora = (dataIso?: string) => {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleString('pt-BR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesInput || !receitaInput || !despesasInput) return alert('Preencha todos os campos.');

    setSalvando(true);
    const { error } = await supabase.from('financeiro_mensal').insert([
      {
        mes: mesInput,
        receita: Number(receitaInput),
        despesas: Number(despesasInput),
      },
    ]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setReceitaInput('');
      setDespesasInput('');
      await carregarDados();
    }
    setSalvando(false);
  };

  const excluirLancamento = async (id: number) => {
    if (!confirm('Deseja excluir este lançamento?')) return;
    await supabase.from('financeiro_mensal').delete().eq('id', id);
    await carregarDados();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Gestão Financeira</h1>
        <p className="text-slate-400 text-sm">Lançamentos com data e hora automática</p>
      </div>

      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700">
        <h2 className="text-lg font-bold text-yellow-400 mb-4">Novo Lançamento</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mês / Ano</label>
            <input
              type="month"
              value={mesInput}
              onChange={(e) => setMesInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Receita (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="10000.00"
              value={receitaInput}
              onChange={(e) => setReceitaInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Despesas (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={despesasInput}
              onChange={(e) => setDespesasInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition"
          >
            {salvando ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
        </form>
      </div>

      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700">
        <h3 className="text-base font-bold text-slate-200 mb-4">Histórico de Lançamentos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2.5 px-3">Data e Hora</th>
                <th className="py-2.5 px-3">Mês Referência</th>
                <th className="py-2.5 px-3">Receita</th>
                <th className="py-2.5 px-3">Despesas</th>
                <th className="py-2.5 px-3">Lucro</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {dadosFinanceiros.map((item) => {
                const lucro = item.receita - item.despesas;
                return (
                  <tr key={item.id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 text-slate-400 text-xs">{formatarDataHora(item.criado_em)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{item.mes}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{formatarMoeda(item.receita)}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-semibold">{formatarMoeda(item.despesas)}</td>
                    <td className={`py-2.5 px-3 font-bold ${lucro >= 0 ? 'text-yellow-400' : 'text-rose-500'}`}>
                      {formatarMoeda(lucro)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => excluirLancamento(item.id)}
                        className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs py-1 px-2.5 rounded"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
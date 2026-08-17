'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RegistroFrota {
  id: number;
  descricao: string;
  valor: number;
  criado_em?: string;
}

export default function FrotaPage() {
  const [registrosFrota, setRegistrosFrota] = useState<RegistroFrota[]>([]);
  const [descricaoInput, setDescricaoInput] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data, error } = await supabase.from('registros_frota').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Erro ao carregar frota:', error);
    } else if (data) {
      setRegistrosFrota(data);
    }
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
    if (!descricaoInput || !valorInput) return alert('Preencha todos os campos.');

    setSalvando(true);
    const { error } = await supabase.from('registros_frota').insert([
      {
        descricao: descricaoInput,
        valor: Number(valorInput),
      },
    ]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setDescricaoInput('');
      setValorInput('');
      await carregarDados();
    }
    setSalvando(false);
  };

  const excluirLancamento = async (id: number) => {
    if (!confirm('Deseja excluir este registro de frota?')) return;
    await supabase.from('registros_frota').delete().eq('id', id);
    await carregarDados();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Gestão de Frota</h1>
        <p className="text-slate-400 text-sm">Controle de despesas e manutenções de veículos</p>
      </div>

      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700">
        <h2 className="text-lg font-bold text-yellow-400 mb-4">Novo Registro de Frota</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição (ex: Combustível, Peças)</label>
            <input
              type="text"
              placeholder="Ex: Troca de pneu / Óleo"
              value={descricaoInput}
              onChange={(e) => setDescricaoInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="150.00"
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition"
          >
            {salvando ? 'Salvando...' : 'Adicionar Registro'}
          </button>
        </form>
      </div>

      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700">
        <h3 className="text-base font-bold text-slate-200 mb-4">Histórico da Frota</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2.5 px-3">Data e Hora</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Valor</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {registrosFrota.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/30">
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{formatarDataHora(item.criado_em)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{item.descricao}</td>
                  <td className="py-2.5 px-3 text-yellow-400 font-semibold">{formatarMoeda(item.valor)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => excluirLancamento(item.id)}
                      className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs py-1 px-2.5 rounded"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
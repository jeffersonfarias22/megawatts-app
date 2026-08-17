'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Veiculo {
  id: number;
  nome_carro: string;
  placa: string;
  gasto_total: number;
}

export default function FrotaPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [nomeCarro, setNomeCarro] = useState('');
  const [placa, setPlaca] = useState('');
  const [gastoTotal, setGastoTotal] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarFrota();
  }, []);

  const carregarFrota = async () => {
    setCarregando(true);
    const { data, error } = await supabase.from('frota').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Erro ao carregar frota:', error);
    } else if (data) {
      setVeiculos(data);
    }
    setCarregando(false);
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSalvarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCarro || !placa) return;

    setSalvando(true);
    const { error } = await supabase.from('frota').insert([
      {
        nome_carro: nomeCarro,
        placa: placa.toUpperCase(),
        gasto_total: Number(gastoTotal) || 0,
      },
    ]);

    if (error) {
      alert('Erro ao salvar veículo: ' + error.message);
    } else {
      setNomeCarro('');
      setPlaca('');
      setGastoTotal('');
      await carregarFrota();
    }
    setSalvando(false);
  };

  const excluirVeiculo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este veículo?')) return;
    const { error } = await supabase.from('frota').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      await carregarFrota();
    }
  };

  // Identificar qual carro gasta mais (ordenando do maior para o menor gasto)
  const veiculosOrdenados = [...veiculos].sort((a, b) => Number(b.gasto_total) - Number(a.gasto_total));
  const carroQueMaisGasta = veiculosOrdenados.length > 0 ? veiculosOrdenados[0] : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80">
        <h1 className="text-2xl font-bold text-white">Controle de Frota</h1>
        <p className="text-slate-400 text-sm">Gerenciamento de veículos, placas e custos</p>
      </div>

      {/* Destaque: Qual carro gasta mais */}
      {carroQueMaisGasta && (
        <div className="bg-slate-800 p-5 rounded-xl border border-rose-500/40 bg-gradient-to-br from-slate-800 to-rose-950/20 shadow">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Veículo com Maior Custo</p>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-xl font-bold text-white">{carroQueMaisGasta.nome_carro}</p>
              <p className="text-xs text-slate-400 font-mono">Placa: {carroQueMaisGasta.placa}</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">{formatarMoeda(carroQueMaisGasta.gasto_total)}</p>
          </div>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow space-y-4">
        <h3 className="text-white font-bold text-base">Cadastrar Novo Veículo</h3>
        <form onSubmit={handleSalvarVeiculo} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Carro</label>
            <input
              type="text"
              required
              placeholder="Ex: Fiat Strada"
              value={nomeCarro}
              onChange={(e) => setNomeCarro(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Placa</label>
            <input
              type="text"
              required
              placeholder="Ex: ABC-1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white uppercase focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Gasto Inicial / Total (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={gastoTotal}
              onChange={(e) => setGastoTotal(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold p-2.5 rounded-lg text-sm transition shadow h-[42px]"
          >
            {salvando ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </form>
      </div>

      {/* Tabela de Veículos (Ordenada automaticamente por quem gasta mais) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white text-base">Frota Cadastrada (Do maior para o menor custo)</h3>
          <span className="text-xs text-slate-400">{veiculos.length} veículo(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="p-3">Veículo</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Gasto Total</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm text-slate-200">
              {carregando ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-slate-400">Carregando frota...</td>
                </tr>
              ) : veiculosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-slate-400">Nenhum veículo cadastrado na frota.</td>
                </tr>
              ) : (
                veiculosOrdenados.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      {index === 0 && <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">Maior Gasto</span>}
                      {item.nome_carro}
                    </td>
                    <td className="p-3 font-mono text-yellow-400 font-semibold">{item.placa}</td>
                    <td className="p-3 font-bold text-rose-400">{formatarMoeda(item.gasto_total)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => excluirVeiculo(item.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 rounded border border-rose-500/20 transition"
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
    </div>
  );
}
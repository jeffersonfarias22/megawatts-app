'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RegistroFrota {
  id: number;
  valor: number;
  criado_em: string;
}

interface RegistroObra {
  id: number;
  valor: number;
  criado_em: string;
}

export default function VisaoGeralPage() {
  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  );
  const [anoFiltro] = useState(String(hoje.getFullYear()));

  const [registrosFrota, setRegistrosFrota] = useState<RegistroFrota[]>([]);
  const [registrosObras, setRegistrosObras] = useState<RegistroObra[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDadosGerais();
  }, []);

  const carregarDadosGerais = async () => {
    setCarregando(true);
    
    // Busca frota
    const { data: dataFrota } = await supabase.from('registros_frota').select('*');
    // Busca obras (ajuste 'valor' se o nome da sua coluna for diferente)
    const { data: dataObras } = await supabase.from('obras').select('*');

    if (dataFrota) setRegistrosFrota(dataFrota);
    if (dataObras) setRegistrosObras(dataObras);
    
    setCarregando(false);
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Cálculos de Frota
  const frotaMes = registrosFrota
    .filter((item) => item.criado_em?.slice(0, 7) === mesFiltro)
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  const frotaAnual = registrosFrota
    .filter((item) => item.criado_em?.slice(0, 4) === anoFiltro)
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Cálculos de Obras
  const obrasMes = registrosObras
    .filter((item) => item.criado_em?.slice(0, 7) === mesFiltro)
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  const obrasAnual = registrosObras
    .filter((item) => item.criado_em?.slice(0, 4) === anoFiltro)
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  const despesasTotaisMes = frotaMes + obrasMes;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
          <p className="text-slate-400 text-sm">Resumo executivo do sistema Megawatts</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg">
          <span className="text-sm">📅</span>
          <span className="text-xs text-slate-400 font-semibold">Filtrar Mês:</span>
          <input
            type="month"
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="bg-transparent text-sm font-semibold text-yellow-400 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Faturamento Total</p>
          <p className="text-xl font-bold text-white mt-2">R$ 0,00</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-rose-400/30 shadow">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Despesas Totais</p>
          <p className="text-xl font-bold text-rose-400 mt-2">{carregando ? '...' : formatarMoeda(despesasTotaisMes)}</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-blue-500/30 shadow">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Obras (Mês)</p>
          <p className="text-xl font-bold text-blue-400 mt-2">{carregando ? '...' : formatarMoeda(obrasMes)}</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-xl border border-blue-500/30 shadow">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Obras Anual</p>
          <p className="text-xl font-bold text-blue-400 mt-2">{carregando ? '...' : formatarMoeda(obrasAnual)}</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-yellow-500/40 bg-gradient-to-br from-slate-800 to-yellow-950/20 shadow">
          <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Frota (Mês)</p>
          <p className="text-xl font-bold text-yellow-400 mt-2">{carregando ? '...' : formatarMoeda(frotaMes)}</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-yellow-500/40 bg-gradient-to-br from-slate-800 to-yellow-950/20 shadow">
          <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Frota Anual</p>
          <p className="text-xl font-bold text-yellow-400 mt-2">{carregando ? '...' : formatarMoeda(frotaAnual)}</p>
        </div>
      </div>
    </div>
  );
}
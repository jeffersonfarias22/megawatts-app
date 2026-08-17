'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Obra {
  id: number;
  nome_obra?: string;
  obra?: string;
  nome?: string;
  cliente?: string;
  orcamento?: number;
  gasto_atual?: number;
  status?: string; // 'em_andamento' | 'concluida'
  criado_em?: string;
}

export default function ObrasPage() {
  // Data atual para o filtro
  const hoje = new Date();
  const mesAtualFormatted = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const [mesSelecionado, setMesSelecionado] = useState(mesAtualFormatted);
  const [obras, setObras] = useState<Obra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Inputs formulário de criação (opcionais)
  const [nomeObra, setNomeObra] = useState('');
  const [cliente, setCliente] = useState('');
  const [orcamentoInput, setOrcamentoInput] = useState('');
  const [gastoAtualInput, setGastoAtualInput] = useState('');

  // Estado para edição de obra
  const [obraEditando, setObraEditando] = useState<Obra | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editOrcamento, setEditOrcamento] = useState('');
  const [editGastoAtual, setEditGastoAtual] = useState('');

  useEffect(() => {
    carregarObras();
  }, []);

  const carregarObras = async () => {
    setCarregando(true);
    const { data } = await supabase.from('obras').select('*').order('id', { ascending: false });
    if (data) setObras(data);
    setCarregando(false);
  };

  // Máscaras e Formatação de BRL
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

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

  // Cadastrar nova obra
  const handleSalvarObra = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeObra && !cliente && !orcamentoInput && !gastoAtualInput) {
      return alert('Preencha ao menos um dos campos para salvar.');
    }

    setSalvando(true);
    const { data: { session } } = await supabase.auth.getSession();

    const orcamentoVal = converterParaNumeroDecimal(orcamentoInput);
    const gastoVal = converterParaNumeroDecimal(gastoAtualInput);

    const dadosParaInserir: any = {
      cliente: cliente || 'Não informado',
      orcamento: orcamentoVal,
      gasto_atual: gastoVal,
      status: 'em_andamento',
      user_id: session?.user?.id,
    };

    if (nomeObra) {
      dadosParaInserir.nome_obra = nomeObra;
      dadosParaInserir.obra = nomeObra;
    }

    let { error } = await supabase.from('obras').insert([dadosParaInserir]);

    if (error) {
      alert('Erro ao salvar obra: ' + error.message);
    } else {
      setNomeObra('');
      setCliente('');
      setOrcamentoInput('');
      setGastoAtualInput('');
      await carregarObras();
    }
    setSalvando(false);
  };

  // Abrir modal de edição
  const iniciarEdicao = (obra: Obra) => {
    setObraEditando(obra);
    setEditNome(obra.nome_obra || obra.obra || obra.nome || '');
    setEditCliente(obra.cliente || '');
    setEditOrcamento(obra.orcamento ? aplicarMascaraMoeda((obra.orcamento * 100).toString()) : '');
    setEditGastoAtual(obra.gasto_atual ? aplicarMascaraMoeda((obra.gasto_atual * 100).toString()) : '');
  };

  // Salvar alterações de edição
  const handleAtualizarObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraEditando) return;

    setSalvando(true);
    const orcamentoVal = converterParaNumeroDecimal(editOrcamento);
    const gastoVal = converterParaNumeroDecimal(editGastoAtual);

    const dadosAtualizados: any = {
      cliente: editCliente || 'Não informado',
      orcamento: orcamentoVal,
      gasto_atual: gastoVal,
      nome_obra: editNome,
      obra: editNome,
    };

    const { error } = await supabase
      .from('obras')
      .update(dadosAtualizados)
      .eq('id', obraEditando.id);

    if (error) {
      alert('Erro ao atualizar obra: ' + error.message);
    } else {
      setObraEditando(null);
      await carregarObras();
    }
    setSalvando(false);
  };

  // Alternar Status (Finalizar / Reabrir Obra)
  const alternarStatusObra = async (obra: Obra) => {
    const novoStatus = obra.status === 'concluida' ? 'em_andamento' : 'concluida';
    const { error } = await supabase
      .from('obras')
      .update({ status: novoStatus })
      .eq('id', obra.id);

    if (error) {
      alert('Erro ao alterar status da obra: ' + error.message);
    } else {
      await carregarObras();
    }
  };

  // Excluir Obra
  const excluirObra = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta obra?')) return;
    await supabase.from('obras').delete().eq('id', id);
    await carregarObras();
  };

  // Ano extraído do seletor de mês (Ex: "2026")
  const anoSelecionado = mesSelecionado ? mesSelecionado.slice(0, 4) : `${hoje.getFullYear()}`;

  // Filtro de Obras por Mês
  const obrasFiltradas = obras.filter((item) => {
    if (!mesSelecionado) return true;
    if (!item.criado_em) return true;
    return item.criado_em.slice(0, 7) === mesSelecionado;
  });

  // CÁLCULOS MENSAIS E ANUAIS
  const obrasEmAndamento = obrasFiltradas.filter((o) => o.status !== 'concluida');
  const obrasConcluidas = obrasFiltradas.filter((o) => o.status === 'concluida');

  const valorEmAndamento = obrasEmAndamento.reduce((acc, curr) => acc + (Number(curr.orcamento) || 0), 0);
  const valorFinalizado = obrasConcluidas.reduce((acc, curr) => acc + (Number(curr.orcamento) || 0), 0);

  const totalOrcamentoMes = obrasFiltradas.reduce((acc, curr) => acc + (Number(curr.orcamento) || 0), 0);
  const totalGastoMes = obrasFiltradas.reduce((acc, curr) => acc + (Number(curr.gasto_atual) || 0), 0);
  const totalSaldoMes = totalOrcamentoMes - totalGastoMes;

  // ACÚMULO ANUAL DE OBRAS FINALIZADAS
  const obrasFinalizadasAno = obras.filter((o) => {
    if (o.status !== 'concluida') return false;
    if (!o.criado_em) return true;
    return o.criado_em.slice(0, 4) === anoSelecionado;
  });

  const totalAcumuladoAnualFinalizadas = obrasFinalizadasAno.reduce(
    (acc, curr) => acc + (Number(curr.orcamento) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Controle de Obras</h1>
          <p className="text-slate-400 text-sm">Acompanhamento financeiro por projeto</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-yellow-500/60 transition px-3 py-2 rounded-lg shadow-inner">
          <span className="text-base">📅</span>
          <label htmlFor="mes-filtro-obras" className="text-xs font-semibold text-slate-300 whitespace-nowrap">
            Filtrar Mês:
          </label>
          <input
            id="mes-filtro-obras"
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="bg-transparent text-sm font-semibold text-yellow-400 focus:outline-none cursor-pointer scheme-dark"
          />
        </div>
      </div>

      {/* PAINEL DE RESUMO (5 CARTÕES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARTÃO: EM ANDAMENTO */}
        <div className="bg-slate-800 p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-800 to-amber-950/20">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Em Andamento</p>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              {obrasEmAndamento.length}
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{formatarMoeda(valorEmAndamento)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Obras em progresso (Mês)</p>
        </div>

        {/* CARTÃO: FINALIZADAS MÊS */}
        <div className="bg-slate-800 p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-800 to-emerald-950/20">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Finalizadas (Mês)</p>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              {obrasConcluidas.length}
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{formatarMoeda(valorFinalizado)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Obras concluídas no mês</p>
        </div>

        {/* CARTÃO: GASTO ATUAL */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gasto Atual (Mês)</p>
          <p className="text-2xl font-bold text-rose-400 mt-2">{formatarMoeda(totalGastoMes)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total de despesas</p>
        </div>

        {/* CARTÃO: SALDO RESTANTE */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Restante (Mês)</p>
          <p className={`text-2xl font-bold mt-2 ${totalSaldoMes >= 0 ? 'text-cyan-400' : 'text-rose-500'}`}>
            {formatarMoeda(totalSaldoMes)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Orçamento - Gastos</p>
        </div>

        {/* CARTÃO: ACÚMULO ANUAL DE OBRAS FINALIZADAS */}
        <div className="bg-slate-800 p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-800 to-cyan-950/20">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Acúmulo Anual ({anoSelecionado})</p>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
              {obrasFinalizadasAno.length}
            </span>
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{formatarMoeda(totalAcumuladoAnualFinalizadas)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total de obras finalizadas no ano</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-base font-bold text-yellow-400 mb-4">Cadastrar Nova Obra</h2>
        <form onSubmit={handleSalvarObra} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Obra <span className="text-slate-500">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Ceilândia"
              value={nomeObra}
              onChange={(e) => setNomeObra(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cliente <span className="text-slate-500">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Nilza"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Orçamento (R$) <span className="text-slate-500">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={orcamentoInput}
              onChange={(e) => setOrcamentoInput(aplicarMascaraMoeda(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-semibold text-sm focus:border-yellow-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Gasto Atual (R$) <span className="text-slate-500">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={gastoAtualInput}
              onChange={(e) => setGastoAtualInput(aplicarMascaraMoeda(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-semibold text-sm focus:border-yellow-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 px-4 rounded-lg text-sm transition shadow-md"
          >
            {salvando ? 'Salvando...' : 'Salvar Obra'}
          </button>
        </form>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {obraEditando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-yellow-400">Editar Obra</h3>
            <form onSubmit={handleAtualizarObra} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Obra</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente</label>
                <input
                  type="text"
                  value={editCliente}
                  onChange={(e) => setEditCliente(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Orçamento (R$)</label>
                  <input
                    type="text"
                    value={editOrcamento}
                    onChange={(e) => setEditOrcamento(aplicarMascaraMoeda(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gasto Atual (R$)</label>
                  <input
                    type="text"
                    value={editGastoAtual}
                    onChange={(e) => setEditGastoAtual(aplicarMascaraMoeda(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setObraEditando(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold py-2 px-4 rounded-lg transition"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABELA DE OBRAS */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700">
        <h3 className="text-base font-bold text-slate-200 mb-4">Obras Cadastradas</h3>
        {carregando ? (
          <p className="text-slate-400 text-sm">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Obra</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Orçamento</th>
                  <th className="py-2.5 px-3">Gasto Atual</th>
                  <th className="py-2.5 px-3">Saldo</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {obrasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500">
                      Nenhuma obra cadastrada para o mês selecionado.
                    </td>
                  </tr>
                ) : (
                  obrasFiltradas.map((item) => {
                    const nomeExibicao = item.nome_obra || item.obra || item.nome || 'Sem Nome';
                    const orcamentoVal = Number(item.orcamento) || 0;
                    const gastoVal = Number(item.gasto_atual) || 0;
                    const saldo = orcamentoVal - gastoVal;
                    const isConcluida = item.status === 'concluida';

                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30">
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isConcluida
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isConcluida ? 'Concluída' : 'Em Andamento'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">{nomeExibicao}</td>
                        <td className="py-2.5 px-3 text-slate-300">{item.cliente || '-'}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold">{formatarMoeda(orcamentoVal)}</td>
                        <td className="py-2.5 px-3 text-rose-400 font-semibold">{formatarMoeda(gastoVal)}</td>
                        <td className={`py-2.5 px-3 font-semibold ${saldo >= 0 ? 'text-cyan-400' : 'text-rose-500'}`}>
                          {formatarMoeda(saldo)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botão Finalizar / Reabrir Obra */}
                            <button
                              onClick={() => alternarStatusObra(item)}
                              title={isConcluida ? 'Reabrir Obra' : 'Finalizar Obra'}
                              className={`text-xs py-1 px-2 rounded font-semibold transition ${
                                isConcluida
                                  ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                                  : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                              }`}
                            >
                              {isConcluida ? 'Reabrir' : 'Finalizar'}
                            </button>

                            {/* Botão Editar */}
                            <button
                              onClick={() => iniciarEdicao(item)}
                              className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs py-1 px-2.5 rounded transition"
                            >
                              Editar
                            </button>

                            {/* Botão Excluir */}
                            <button
                              onClick={() => excluirObra(item.id)}
                              className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs py-1 px-2.5 rounded transition"
                            >
                              Exclui
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
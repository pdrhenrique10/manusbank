/** Formata Date local como YYYY-MM-DD (sem fuso UTC). */
export function formatarDataLocal(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Retorna a data de hoje no dispositivo do usuário. */
export function dataHojeLocal() {
  return formatarDataLocal(new Date());
}

/** Último dia do mês (mes 1-indexed). */
export function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Retorna a janela de datas do mês atual (baseado na data do dispositivo).
 * Exemplo: se hoje for 15/07/2026, retorna { dataInicio: "2026-07-01", dataFim: "2026-07-31" }.
 */
export function janelaMesAtual() {
  const hoje = dataHojeLocal();
  const [anoStr, mesStr] = hoje.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const ultimoDia = ultimoDiaDoMes(ano, mes);

  return {
    dataInicio: `${anoStr}-${mesStr}-01`,
    dataFim: `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function calcularJanelaPeriodo(periodo, hojeStr = dataHojeLocal()) {
  // ... (mantenha a implementação original se necessário, ou remova se não usar)
}

export function dentroDoPeriodo(dataStr, dataInicio, dataFim) {
  return dataStr >= dataInicio && dataStr <= dataFim;
}

/** Retorna o nome do mês abreviado e ano para uma data YYYY-MM-DD. */
export function nomeMesAno(dataStr) {
  if (!dataStr) return "";
  const [ano, mes] = dataStr.split("-");
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${meses[parseInt(mes, 10) - 1]} ${ano}`;
}

/**
 * Retorna o nome do mês/ano formatado conforme o locale.
 * Exemplo: locale "pt-BR" → "julho de 2026", locale "en" → "July 2026"
 */
export function nomeMesAnoFormatado(dataStr, locale = 'pt-BR') {
  if (!dataStr) return "";
  const [ano, mes] = dataStr.split("-");
  const date = new Date(Number(ano), Number(mes) - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
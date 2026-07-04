import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Paleta baseada no tema do dashboard
const CORES = {
  azul: [56, 189, 248],
  verde: [74, 222, 128],
  vermelho: [248, 113, 113],
  roxo: [192, 132, 252],
  textoPrimario: [15, 23, 42],
  textoSecundario: [100, 116, 139],
  fundoCard: [248, 250, 252],
  borda: [226, 232, 240],
  categorias: [
    [56, 189, 248],
    [34, 197, 94],
    [245, 158, 11],
    [239, 68, 68],
    [168, 85, 247],
    [236, 72, 153],
  ],
};

function desenharCard(doc, x, y, largura, altura, corBorda, label, valor) {
  doc.setFillColor(...CORES.fundoCard);
  doc.setDrawColor(...CORES.borda);
  doc.roundedRect(x, y, largura, altura, 4, 4, "FD");

  // Barra lateral colorida
  doc.setFillColor(...corBorda);
  doc.roundedRect(x, y, 3, altura, 1.5, 1.5, "F");

  doc.setTextColor(...CORES.textoSecundario);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 10, y + 14);

  doc.setTextColor(...CORES.textoPrimario);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(valor, x + 10, y + 27);
}

function desenharRodape(doc) {
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...CORES.borda);
    doc.line(14, altura - 15, largura - 14, altura - 15);

    doc.setFontSize(8);
    doc.setTextColor(...CORES.textoSecundario);
    doc.setFont("helvetica", "normal");
    doc.text("ManusFinance", 14, altura - 9);
    doc.text(`Página ${i} de ${totalPaginas}`, largura - 14, altura - 9, {
      align: "right",
    });
  }
}

export function exportarRelatorioPDF({
  saldo,
  receitas,
  despesas,
  resultado,
  categoriasComPercentual,
  insights,
  nomeMesTraduzido,
  formatMoney,
  t,
}) {
  const doc = new jsPDF();
  const largura = doc.internal.pageSize.getWidth();
  let y = 0;

  // ---------- CABEÇALHO ----------
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, largura, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  doc.text(t("relatorios.title"), 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`${t("relatorios.subtitle")} ${nomeMesTraduzido}`, 14, 27);

  const dataGeracao = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.text(`Gerado em ${dataGeracao}`, largura - 14, 27, { align: "right" });

  y = 50;

  // ---------- CARDS DE RESUMO ----------
  const gap = 6;
  const larguraCard = (largura - 28 - gap * 3) / 4;
  const alturaCard = 32;

  const cards = [
    { label: t("relatorios.balance"), valor: saldo, cor: CORES.azul },
    { label: t("relatorios.income"), valor: receitas, cor: CORES.verde },
    { label: t("relatorios.expenses"), valor: despesas, cor: CORES.vermelho },
    {
      label: t("relatorios.result"),
      valor: resultado,
      cor: resultado >= 0 ? CORES.azul : CORES.roxo,
    },
  ];

  cards.forEach((card, i) => {
    const x = 14 + i * (larguraCard + gap);
    desenharCard(
      doc,
      x,
      y,
      larguraCard,
      alturaCard,
      card.cor,
      card.label,
      formatMoney(card.valor)
    );
  });

  y += alturaCard + 18;

  // ---------- TABELA COMPARATIVO ENTRADAS X SAÍDAS ----------
  doc.setTextColor(...CORES.textoPrimario);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t("relatorios.flowTitle") || "Fluxo do mês", 14, y);
  y += 6;

 autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: CORES.textoSecundario,
      fontStyle: "bold",
      fontSize: 10, // 👈 era 8, agora igual ao body pra ficar do mesmo tamanho
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: "auto", fontStyle: "bold" },
    },
    head: [[t("relatorios.income"), formatMoney(receitas)]],
    body: [[t("relatorios.expenses"), formatMoney(despesas)]],
    didParseCell: (data) => {
      if (data.column.index === 1) {
        data.cell.styles.halign = "right";
      }

      if (data.row.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = CORES.vermelho;
      }
      if (data.row.section === "head" && data.column.index === 1) {
        data.cell.styles.textColor = CORES.verde;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 16;

  // ---------- CATEGORIAS ----------
  if (categoriasComPercentual.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CORES.textoPrimario);
    doc.text(t("relatorios.categoriesTitle"), 14, y);
    y += 8;

    const larguraBarraMax = largura - 28 - 70;

    categoriasComPercentual.forEach((cat, i) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      const cor = CORES.categorias[i % CORES.categorias.length];

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CORES.textoPrimario);
      doc.text(cat.nome, 14, y);

      doc.setFont("helvetica", "bold");
      doc.text(formatMoney(cat.valor), largura - 14, y, { align: "right" });

      y += 4;

      // Trilho de fundo da barra
      doc.setFillColor(...CORES.borda);
      doc.roundedRect(14, y, larguraBarraMax, 3.5, 1.5, 1.5, "F");

      // Barra preenchida proporcional ao percentual
      const percentual = Math.min(Number(cat.percentual) || 0, 100);
      const larguraPreenchida = (larguraBarraMax * percentual) / 100;
      if (larguraPreenchida > 0) {
        doc.setFillColor(...cor);
        doc.roundedRect(14, y, larguraPreenchida, 3.5, 1.5, 1.5, "F");
      }

      doc.setFontSize(8);
      doc.setTextColor(...CORES.textoSecundario);
      doc.text(`${cat.percentual}%`, largura - 14, y + 3, { align: "right" });

      y += 12;
    });

    y += 6;
  }

  // ---------- INSIGHTS ----------
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.textoPrimario);
  doc.text(t("relatorios.insightsTitle"), 14, y);
  y += 8;

  const coresInsight = [CORES.azul, CORES.roxo, CORES.verde];

  insights.forEach((insight, i) => {
    const linhas = doc.splitTextToSize(insight, largura - 28 - 12);
    const alturaBox = linhas.length * 5 + 8;

    if (y + alturaBox > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, largura - 28, alturaBox, 3, 3, "F");

    doc.setFillColor(...coresInsight[i % coresInsight.length]);
    doc.roundedRect(14, y, 2.5, alturaBox, 1, 1, "F");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(linhas, 22, y + 7);

    y += alturaBox + 6;
  });

  desenharRodape(doc);

  doc.save(`relatorio-${nomeMesTraduzido}.pdf`);
}
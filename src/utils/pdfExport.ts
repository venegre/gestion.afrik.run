import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  date: string;
  clients: {
    name: string;
  };
  amount_sent: number;
  amount_paid: number;
  amount_to_pay: number;
}

interface ExportResult {
  success: boolean;
  message?: string;
}

const formatAmount = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
};

export const exportTransactionsToPDF = async (
  transactions: Transaction[],
  dateRange: { start: Date; end: Date }
): Promise<ExportResult> => {
  try {
    // Format date range strings
    const startDateStr = format(dateRange.start, 'dd/MM/yyyy', { locale: fr });
    const endDateStr = format(dateRange.end, 'dd/MM/yyyy', { locale: fr });

    // Filter transactions within date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
    });

    if (filteredTransactions.length === 0) {
      return {
        success: false,
        message: 'Aucune transaction trouvée pour cette période'
      };
    }

    // Créer le document PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Définir la police et la taille
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    // En-tête
    doc.setFontSize(20);
    doc.text('Récapitulatif des Transactions', 14, 20);
    
    doc.setFontSize(14);
    doc.text(
      `Période: du ${startDateStr} au ${endDateStr}`,
      14, 
      30
    );

    // Regrouper les transactions par client
    const clientTotals = transactions.reduce((acc, transaction) => {
      const clientName = transaction.clients.name;
      if (!acc[clientName]) {
        acc[clientName] = {
          totalSent: 0,
          totalToPay: 0,
          totalPaid: 0,
          previousDebt: 0
        };
      }

      const transactionDate = new Date(transaction.date);

      if (isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end })) {
        acc[clientName].totalSent += transaction.amount_sent;
        acc[clientName].totalToPay += transaction.amount_to_pay;
        acc[clientName].totalPaid += transaction.amount_paid;
      } else if (transactionDate < dateRange.start) {
        acc[clientName].previousDebt += (transaction.amount_to_pay - transaction.amount_paid);
      }

      return acc;
    }, {} as Record<string, { totalSent: number; totalToPay: number; totalPaid: number; previousDebt: number }>);

    // Convertir les totaux en tableau pour le PDF
    const tableData = Object.entries(clientTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([clientName, totals]) => {
        const currentDebt = totals.totalToPay - totals.totalPaid;
        const totalDebt = totals.previousDebt + currentDebt;

        return [
          clientName,
          formatAmount(totals.totalSent),
          formatAmount(totals.totalToPay),
          formatAmount(totalDebt)
        ];
      });

    // Générer le tableau
    (doc as any).autoTable({
      startY: 40,
      head: [['Client', 'Montant Envoyé', 'Montant à Payer', 'Dette Totale']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 6,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40 },
      didDrawPage: (data: any) => {
        // Ajouter le numéro de page
        const str = `Page ${doc.getCurrentPageInfo().pageNumber}`;
        doc.setFontSize(10);
        doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
          align: 'center'
        });
      }
    });

    // Calculer les totaux généraux
    const grandTotal = Object.values(clientTotals).reduce(
      (acc, { totalSent, totalToPay, totalPaid, previousDebt }) => ({
        sent: acc.sent + totalSent,
        toPay: acc.toPay + totalToPay,
        paid: acc.paid + totalPaid,
        totalDebt: acc.totalDebt + previousDebt + (totalToPay - totalPaid)
      }),
      { sent: 0, toPay: 0, paid: 0, totalDebt: 0 }
    );

    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // Vérifier l'espace disponible
    if (finalY + 40 > doc.internal.pageSize.height - 20) {
      doc.addPage();
    }

    // Ajouter les totaux généraux
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Totaux Généraux:', 14, finalY + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Envoyé: ${formatAmount(grandTotal.sent)}`, 14, finalY + 30);
    doc.text(`Total à Payer: ${formatAmount(grandTotal.toPay)}`, 14, finalY + 40);
    doc.text(`Dette Totale: ${formatAmount(grandTotal.totalDebt)}`, 14, finalY + 50);

    // Ajouter la date et l'heure de génération
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );

    // Générer le nom du fichier
    const fileName = `recap_${format(dateRange.start, 'dd-MM-yyyy')}_${format(dateRange.end, 'dd-MM-yyyy')}.pdf`;

    // Sauvegarder le PDF
    doc.save(fileName);

    return {
      success: true
    };
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Impossible de générer le PDF. Veuillez réessayer.'
    };
  }
};

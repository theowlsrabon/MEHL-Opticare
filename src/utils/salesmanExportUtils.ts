import { SaleRecord, Salesman } from '../types';

export interface SalesmanPerformanceRow {
  salesman: Salesman;
  salesCount: number;
  framesSold: number;
  lensesSold: number;
  accessoriesSold: number;
  grossSales: number;
  discountTotal: number;
  netSales: number;
  commissionEarned: number;
}

/**
 * Generates and triggers download of a clean Excel-compatible CSV file with UTF-8 BOM.
 */
export function exportSalesmanReportToCSV(
  summaryRows: SalesmanPerformanceRow[],
  filteredSales: SaleRecord[],
  periodLabel: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `Madina_Optical_Salesman_Commission_${periodLabel.replace(/\s+/g, '_')}_${timestamp.slice(0, 10)}.csv`;

  const lines: string[] = [];

  // Header information
  lines.push('MADINA EYE HOSPITAL LTD. - OPTICAL LAB & DISPENSARY ERP');
  lines.push(`SALESMAN COMMISSION & PERFORMANCE AUDIT REPORT - [${periodLabel.toUpperCase()}]`);
  lines.push(`Generated On: ${new Date()?.toLocaleString()}`);
  lines.push('');

  // 1. Executive Summary Table
  lines.push('=== SALESMAN PERFORMANCE SUMMARY ===');
  lines.push([
    'Employee ID',
    'Salesman Name',
    'Status',
    'Commission Rate (%)',
    'Orders Count',
    'Frames Sold (Qty)',
    'Lenses Sold (Qty)',
    'Accessories (Qty)',
    'Gross Sales (BDT)',
    'Discounts (BDT)',
    'Net Sales (BDT)',
    'Commission Earned (BDT)',
  ].map(escapeCSV).join(','));

  let totalOrders = 0;
  let totalFrames = 0;
  let totalLenses = 0;
  let totalAccessories = 0;
  let totalGross = 0;
  let totalDiscounts = 0;
  let totalNet = 0;
  let totalCommission = 0;

  summaryRows.forEach((row) => {
    totalOrders += row.salesCount;
    totalFrames += row.framesSold;
    totalLenses += row.lensesSold;
    totalAccessories += row.accessoriesSold;
    totalGross += row.grossSales;
    totalDiscounts += row.discountTotal;
    totalNet += row.netSales;
    totalCommission += row.commissionEarned;

    lines.push([
      row.salesman.employeeId,
      row.salesman.name,
      row.salesman.status.toUpperCase(),
      `${row.salesman.commissionPct}%`,
      row.salesCount,
      row.framesSold,
      row.lensesSold,
      row.accessoriesSold,
      row.grossSales.toFixed(2),
      row.discountTotal.toFixed(2),
      row.netSales.toFixed(2),
      row.commissionEarned.toFixed(2),
    ].map(escapeCSV).join(','));
  });

  // Summary Totals Row
  lines.push([
    'TOTALS',
    'All Salesmen',
    '-',
    '-',
    totalOrders,
    totalFrames,
    totalLenses,
    totalAccessories,
    totalGross.toFixed(2),
    totalDiscounts.toFixed(2),
    totalNet.toFixed(2),
    totalCommission.toFixed(2),
  ].map(escapeCSV).join(','));

  lines.push('');
  lines.push('=== INDIVIDUAL INVOICES AUDIT TRAIL ===');
  lines.push([
    'Invoice Number',
    'Date & Time',
    'Salesman Name',
    'Employee ID',
    'Patient Name',
    'Contact Phone',
    'Frames Sold',
    'Lenses Sold',
    'Items Summary',
    'Payment Method',
    'Gross (BDT)',
    'Discount (BDT)',
    'Net Amount (BDT)',
    'Commission Rate (%)',
    'Commission Earned (BDT)',
    'Payment Status',
  ].map(escapeCSV).join(','));

  filteredSales.forEach((sale) => {
    lines.push([
      sale.invoiceNumber,
      sale.timestamp,
      sale.salesmanName,
      sale.employeeId || '-',
      sale.patientName,
      sale.patientPhone || '-',
      sale.framesCount,
      sale.lensesCount,
      sale.itemsSummary,
      sale.paymentMethod,
      sale.subtotal.toFixed(2),
      sale.discountAmount.toFixed(2),
      sale.totalAmount.toFixed(2),
      `${sale.commissionPct}%`,
      sale.commissionEarned.toFixed(2),
      sale.dueAmount > 0 ? `Due BDT ${sale.dueAmount}` : 'Paid in Full',
    ].map(escapeCSV).join(','));
  });

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

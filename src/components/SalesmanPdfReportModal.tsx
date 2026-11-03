import React from 'react';
import { SalesmanPerformanceRow } from '../utils/salesmanExportUtils';
import { SaleRecord } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';

interface SalesmanPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  summaryRows: SalesmanPerformanceRow[];
  salesRecords: SaleRecord[];
  generatedBy?: string;
}

export const SalesmanPdfReportModal: React.FC<SalesmanPdfReportModalProps> = ({
  isOpen,
  onClose,
  periodLabel,
  summaryRows,
  salesRecords,
  generatedBy = 'Administrator',
}) => {
  if (!isOpen) return null;

  const totalOrders = summaryRows.reduce((acc, r) => acc + r.salesCount, 0);
  const totalFrames = summaryRows.reduce((acc, r) => acc + r.framesSold, 0);
  const totalLenses = summaryRows.reduce((acc, r) => acc + r.lensesSold, 0);
  const totalNet = summaryRows.reduce((acc, r) => acc + r.netSales, 0);
  const totalCommission = summaryRows.reduce((acc, r) => acc + r.commissionEarned, 0);

  const handlePrint = () => {
    printElementById('salesman-printable-report', {
      title: `Salesman_Commission_Report_${periodLabel.replace(/\s+/g, '_')}`,
      pageMargin: '10mm',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-surface-container-lowest dark:bg-[#131720] rounded-2xl shadow-2xl border border-outline-variant/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Action Header (Hidden during actual paper print) */}
        <div className="print:hidden px-6 py-4 bg-surface-container-low dark:bg-[#1b202c] border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#169b90]/15 text-[#169b90] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                Salesman Commission &amp; Performance PDF Statement
              </h3>
              <p className="text-xs text-outline">
                Official hospital accounts format • Ready for print or save to PDF
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#252a37] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="salesman-printable-report" className="overflow-y-auto p-8 bg-white text-gray-900 font-sans print:p-0 print:m-0">
          {/* Hospital Header & Letterhead */}
          <div className="border-b-2 border-teal-800 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xl font-black tracking-tight text-teal-800 uppercase font-data-rx">
                    MADINA EYE HOSPITAL LTD.
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300">
                    DISPENSARY ERP
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Department of Optical Dispensing, Refraction &amp; Automated Glazing
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  12/A Satmasjid Road, Dhanmondi, Dhaka-1209 • Phone: +880 2-9123456 • VAT Reg: 001928341-0101
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Period: {periodLabel}
                </span>
                <div className="text-[11px] text-gray-500 mt-1.5">
                  Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[11px] text-gray-500">
                  Auditor: <span className="font-semibold text-gray-800">{generatedBy}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">
                Salesman Commission &amp; Performance Audit Statement
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                Official Financial Document #STMT-{Date.now().toString().slice(-6)}
              </span>
            </div>
          </div>

          {/* Key Metric Summary Boxes */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Total Net Sales
              </span>
              <div className="text-lg font-extrabold text-teal-900 mt-0.5 font-mono">
                ৳{totalNet?.toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-500">
                {totalOrders} Invoices billed
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Frames Dispensed
              </span>
              <div className="text-lg font-extrabold text-blue-900 mt-0.5 font-mono">
                {totalFrames} <span className="text-xs font-normal text-gray-500">Units</span>
              </div>
              <span className="text-[10px] text-gray-500">
                Designer &amp; standard optical
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Lenses Dispensed
              </span>
              <div className="text-lg font-extrabold text-indigo-900 mt-0.5 font-mono">
                {totalLenses} <span className="text-xs font-normal text-gray-500">Lenses</span>
              </div>
              <span className="text-[10px] text-gray-500">
                Single vision &amp; progressive
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Total Commission Payable
              </span>
              <div className="text-lg font-extrabold text-emerald-950 mt-0.5 font-mono">
                ৳{totalCommission?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Payable to staff salesmen
              </span>
            </div>
          </div>

          {/* Salesman Performance Table */}
          <div className="mb-6">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
              1. Salesman Sales &amp; Commission Calculation Matrix
            </h4>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b border-gray-300 font-bold">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Salesman Name</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-2 text-center">Rate</th>
                    <th className="py-2.5 px-2 text-center">Invoices</th>
                    <th className="py-2.5 px-2 text-center">Frames</th>
                    <th className="py-2.5 px-2 text-center">Lenses</th>
                    <th className="py-2.5 px-3 text-right">Net Sales (BDT)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-teal-900">Commission (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summaryRows.map((row) => (
                    <tr key={row.salesman.id} className="hover:bg-gray-50/80">
                      <td className="py-2 px-3 font-mono font-semibold text-gray-700">
                        {row.salesman.employeeId}
                      </td>
                      <td className="py-2 px-3 font-bold text-gray-900">
                        {row.salesman.name}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.salesman.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {row.salesman.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-gray-700">
                        {row.salesman.commissionPct}%
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-gray-700">
                        {row.salesCount}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-blue-800">
                        {row.framesSold}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-indigo-800">
                        {row.lensesSold}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                        ৳{row.netSales?.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/50">
                        ৳{row.commissionEarned?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-400">
                    <td colSpan={4} className="py-2.5 px-3 uppercase tracking-wider text-[11px]">
                      Hospital Total
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">{totalOrders}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-900">{totalFrames}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-indigo-900">{totalLenses}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-teal-900 font-bold">
                      ৳{totalNet?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-950 font-black bg-emerald-100/70">
                      ৳{totalCommission?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Individual Invoices Audit Trail */}
          <div className="mb-8">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
              2. Transaction Audit Trail for Selected Period ({salesRecords.length} Invoices)
            </h4>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b border-gray-300 font-bold">
                    <th className="py-2 px-2">Inv #</th>
                    <th className="py-2 px-2">Date &amp; Time</th>
                    <th className="py-2 px-2">Salesman</th>
                    <th className="py-2 px-2">Patient</th>
                    <th className="py-2 px-1 text-center">F</th>
                    <th className="py-2 px-1 text-center">L</th>
                    <th className="py-2 px-2">Items Summary</th>
                    <th className="py-2 px-2 text-right">Net (BDT)</th>
                    <th className="py-2 px-2 text-right text-emerald-800 font-bold">Comm.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesRecords.slice(0, 15).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="py-1.5 px-2 font-mono font-bold text-teal-800">{s.invoiceNumber}</td>
                      <td className="py-1.5 px-2 text-gray-600 whitespace-nowrap">{s.timestamp}</td>
                      <td className="py-1.5 px-2 font-semibold text-gray-900">{s.salesmanName}</td>
                      <td className="py-1.5 px-2 text-gray-800">{s.patientName}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{s.framesCount}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{s.lensesCount}</td>
                      <td className="py-1.5 px-2 text-gray-600 truncate max-w-[180px]">{s.itemsSummary}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">৳{s.totalAmount?.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-800">৳{s.commissionEarned.toFixed(1)}</td>
                    </tr>
                  ))}
                  {salesRecords.length > 15 && (
                    <tr className="bg-gray-50 text-gray-500 italic text-center">
                      <td colSpan={9} className="py-2">
                        + {salesRecords.length - 15} additional invoices documented in the digital ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authorization & Sign-off Block */}
          <div className="pt-8 border-t border-gray-300 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-gray-400 w-40 mx-auto mb-2 h-10 flex items-end justify-center font-cursive italic text-gray-700">
                {generatedBy}
              </div>
              <p className="font-bold text-gray-800">Prepared By</p>
              <p className="text-[10px] text-gray-500">Dispensary Audit Officer</p>
            </div>

            <div>
              <div className="border-b border-gray-400 w-40 mx-auto mb-2 h-10"></div>
              <p className="font-bold text-gray-800">Verified By</p>
              <p className="text-[10px] text-gray-500">Chief Accountant &amp; Financial Controller</p>
            </div>

            <div>
              <div className="border-b border-gray-400 w-40 mx-auto mb-2 h-10"></div>
              <p className="font-bold text-gray-800">Approved By</p>
              <p className="text-[10px] text-gray-500">Hospital Managing Director</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-3">
            Madina Eye Hospital ERP System • Generated electronically • Tamper-evident ledger record
          </div>

          <PrintFooterQuantum />
        </div>
      </div>
    </div>
  );
};

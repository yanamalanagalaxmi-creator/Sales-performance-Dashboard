/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SalesRecord } from '../types';
import { Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, FilterX } from 'lucide-react';

interface DataGridProps {
  data: SalesRecord[];
}

type SortKey = 'date' | 'product' | 'category' | 'revenue' | 'profit' | 'region' | 'salesperson';
type SortOrder = 'asc' | 'desc';

export default function DataGrid({ data }: DataGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter based on search term
  const filteredData = useMemo(() => {
    setCurrentPage(1); // Reset to first page on search
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter((rec) => {
      return (
        rec.product.toLowerCase().includes(term) ||
        rec.category.toLowerCase().includes(term) ||
        rec.region.toLowerCase().includes(term) ||
        rec.salesperson.toLowerCase().includes(term) ||
        rec.channel.toLowerCase().includes(term) ||
        rec.id.toString().toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey === 'date') {
        return sortOrder === 'asc' 
          ? new Date(valA).getTime() - new Date(valB).getTime()
          : new Date(valB).getTime() - new Date(valA).getTime();
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleDownloadCSV = () => {
    if (sortedData.length === 0) return;

    // Headers
    const headers = [
      'Transaction ID',
      'Date',
      'Product Name',
      'Category',
      'Quantity',
      'Unit Price ($)',
      'Unit Cost ($)',
      'Gross Revenue ($)',
      'Goods Cost ($)',
      'Net Profit ($)',
      'Profit Margin (%)',
      'Region',
      'Sales Representative',
      'Sales Channel',
    ];

    // Map rows
    const rows = sortedData.map((rec) => [
      rec.id,
      rec.date,
      `"${rec.product.replace(/"/g, '""')}"`,
      `"${rec.category.replace(/"/g, '""')}"`,
      rec.quantity,
      rec.unitPrice,
      rec.unitCost,
      rec.revenue,
      rec.cost,
      rec.profit,
      Math.round(rec.margin * 10000) / 100,
      `"${rec.region.replace(/"/g, '""')}"`,
      `"${rec.salesperson.replace(/"/g, '""')}"`,
      `"${rec.channel.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Performance_Data_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div id="data-grid-section" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="grid-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products, categories, reps, or regions..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-[10px]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            id="grid-rows-select"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>

          <button
            id="grid-export-button"
            onClick={handleDownloadCSV}
            disabled={sortedData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Excel Table View */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product')}>
                <div className="flex items-center gap-1.5">
                  <span>Product Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                Qty
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer text-right hover:bg-slate-100 transition-colors" onClick={() => handleSort('revenue')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer text-right hover:bg-slate-100 transition-colors" onClick={() => handleSort('profit')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Net Profit</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('region')}>
                <div className="flex items-center gap-1.5">
                  <span>Region / Rep</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Channel
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <FilterX className="w-7 h-7 text-slate-300" />
                    <span className="font-bold">No transactions found</span>
                    <span className="text-[11px]">Try adjusting your search terms or filter sliders.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((rec) => {
                const marginPercent = Math.round(rec.margin * 100);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-550 whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-[11px]">{rec.product}</div>
                      <div className="text-slate-400 text-[10px] font-medium font-mono">{rec.id}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 uppercase tracking-wider font-mono">
                        {rec.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[11px] whitespace-nowrap text-slate-600">
                      {rec.quantity}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[11px] font-bold whitespace-nowrap text-slate-850">
                      {formatCurrency(rec.revenue)}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <div className="font-mono text-[11px] font-bold text-emerald-600">{formatCurrency(rec.profit)}</div>
                      <div className="text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-wider">{marginPercent}% margin</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[11px]">
                      <div className="text-slate-800 font-semibold">{rec.salesperson}</div>
                      <div className="text-slate-450 text-[10px] font-mono">{rec.region}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono uppercase tracking-wider">
                        {rec.channel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedData.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="text-[11px] text-slate-500 font-semibold">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * rowsPerPage, sortedData.length)}
            </span>{' '}
            of <span className="font-bold text-slate-700">{sortedData.length}</span> transaction rows
          </div>

          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-bold text-indigo-600 font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

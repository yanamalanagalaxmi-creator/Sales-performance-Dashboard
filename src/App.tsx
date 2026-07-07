/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { generateSampleSalesData } from './utils/sampleData';
import { SalesRecord, FilterState, MetricSummary } from './types';
import KPICards from './components/KPICards';
import SalesCharts from './components/SalesCharts';
import DataGrid from './components/DataGrid';
import AIAnalyst from './components/AIAnalyst';

import {
  TrendingUp,
  Upload,
  RefreshCw,
  Download,
  Filter,
  Layers,
  MapPin,
  Calendar,
  Users,
  Building,
  Info,
  Sparkles,
  BarChart4,
  Briefcase
} from 'lucide-react';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Master Sales Records State
  const initialData = useMemo(() => generateSampleSalesData(), []);
  const [salesData, setSalesData] = useState<SalesRecord[]>(initialData);
  const [isSampleLoaded, setIsSampleLoaded] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Dynamic filter lists based on the active dataset (Power BI style!)
  const filterOptions = useMemo(() => {
    const categoriesSet = new Set<string>();
    const regionsSet = new Set<string>();
    const channelsSet = new Set<string>();
    const repsSet = new Set<string>();
    let minDate = '';
    let maxDate = '';

    salesData.forEach((rec) => {
      categoriesSet.add(rec.category);
      regionsSet.add(rec.region);
      channelsSet.add(rec.channel);
      repsSet.add(rec.salesperson);

      if (!minDate || rec.date < minDate) minDate = rec.date;
      if (!maxDate || rec.date > maxDate) maxDate = rec.date;
    });

    return {
      categories: ['All', ...Array.from(categoriesSet).sort()],
      regions: ['All', ...Array.from(regionsSet).sort()],
      channels: ['All', ...Array.from(channelsSet).sort()],
      salespersons: ['All', ...Array.from(repsSet).sort()],
      minDate: minDate || '2025-01-01',
      maxDate: maxDate || '2026-12-31'
    };
  }, [salesData]);

  // Active Slicer / Filter State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    region: 'All',
    category: 'All',
    channel: 'All',
    salesperson: 'All'
  });

  // Set default dates based on loaded data
  React.useEffect(() => {
    setFilters({
      startDate: filterOptions.minDate,
      endDate: filterOptions.maxDate,
      region: 'All',
      category: 'All',
      channel: 'All',
      salesperson: 'All'
    });
  }, [filterOptions]);

  const handleResetFilters = () => {
    setFilters({
      startDate: filterOptions.minDate,
      endDate: filterOptions.maxDate,
      region: 'All',
      category: 'All',
      channel: 'All',
      salesperson: 'All'
    });
  };

  // Perform active filtering on the master dataset
  const filteredSalesData = useMemo(() => {
    return salesData.filter((rec) => {
      // Date filter
      if (filters.startDate && rec.date < filters.startDate) return false;
      if (filters.endDate && rec.date > filters.endDate) return false;

      // Slicer filters
      if (filters.region !== 'All' && rec.region !== filters.region) return false;
      if (filters.category !== 'All' && rec.category !== filters.category) return false;
      if (filters.channel !== 'All' && rec.channel !== filters.channel) return false;
      if (filters.salesperson !== 'All' && rec.salesperson !== filters.salesperson) return false;

      return true;
    });
  }, [salesData, filters]);

  // Compute metrics summary of current filtered records
  const metricsSummary = useMemo(() => {
    const recordCount = filteredSalesData.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;

    filteredSalesData.forEach((rec) => {
      totalRevenue += rec.revenue;
      totalCost += rec.cost;
      totalProfit += rec.profit;
      totalUnitsSold += rec.quantity;
    });

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin: totalRevenue > 0 ? totalProfit / totalRevenue : 0,
      totalUnitsSold,
      avgOrderValue: recordCount > 0 ? totalRevenue / recordCount : 0,
      recordCount
    };
  }, [filteredSalesData]);

  // Smart Mapper to import spreadsheet files from user
  const handleFileUpload = (file: File) => {
    setImportError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const dataBuffer = e.target?.result;
        if (!dataBuffer) throw new Error('Could not read file contents.');

        const workbook = XLSX.read(dataBuffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        
        // Parse into row list
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
        if (rawRows.length === 0) {
          throw new Error('The spreadsheet appears to be empty.');
        }

        // Locate headers dynamically using case-insensitive mapping
        const keys = Object.keys(rawRows[0]);
        const findKey = (candidates: string[]): string | null => {
          for (const key of keys) {
            const normalized = key.toLowerCase().replace(/[\s_-]/g, '');
            if (candidates.some(c => normalized.includes(c))) {
              return key;
            }
          }
          return null;
        };

        const dateCol = findKey(['date', 'time', 'orderdate', 'salesdate']);
        const prodCol = findKey(['product', 'item', 'desc', 'description', 'name']);
        const catCol = findKey(['category', 'type', 'prodcat', 'grp', 'group']);
        const qtyCol = findKey(['quantity', 'qty', 'units', 'vol', 'volume', 'amount']);
        const priceCol = findKey(['price', 'unitprice', 'rate', 'costprice']);
        const costCol = findKey(['cost', 'unitcost', 'buyingprice', 'cogs']);
        const revCol = findKey(['revenue', 'grossrevenue', 'sales', 'salesamount']);
        const profitCol = findKey(['profit', 'netprofit', 'earnings']);
        const regionCol = findKey(['region', 'territory', 'location', 'country', 'state', 'city']);
        const repCol = findKey(['salesperson', 'rep', 'salesrep', 'seller', 'agent']);
        const channelCol = findKey(['channel', 'saleschannel', 'medium', 'source']);

        let idCounter = 1;
        const mappedRecords: SalesRecord[] = rawRows.map((row) => {
          // Dynamic standard fallback calculations
          const date = row[dateCol || ''] || new Date().toISOString().slice(0, 10);
          const product = row[prodCol || ''] || 'Standard Product';
          const category = row[catCol || ''] || 'Miscellaneous';
          const quantity = Number(row[qtyCol || '']) || 1;
          const unitPrice = Number(row[priceCol || '']) || 50;
          const unitCost = Number(row[costCol || '']) || (unitPrice * 0.6); // default 40% margin

          const calculatedRevenue = Number(row[revCol || '']) || (quantity * unitPrice);
          const calculatedCost = Number(row[costCol || '']) ? (quantity * Number(row[costCol || ''])) : (quantity * unitCost);
          const calculatedProfit = Number(row[profitCol || '']) || (calculatedRevenue - calculatedCost);
          const margin = calculatedRevenue > 0 ? (calculatedProfit / calculatedRevenue) : 0;

          const region = row[regionCol || ''] || 'Global';
          const salesperson = row[repCol || ''] || 'Internal';
          const channel = row[channelCol || ''] || 'Direct Channel';

          return {
            id: row['Transaction ID'] || row['id'] || `IMP-${idCounter++}`,
            date: String(date).slice(0, 10),
            product: String(product),
            category: String(category),
            quantity,
            unitPrice,
            unitCost,
            revenue: Math.round(calculatedRevenue * 100) / 100,
            cost: Math.round(calculatedCost * 100) / 100,
            profit: Math.round(calculatedProfit * 100) / 100,
            margin: Math.round(margin * 10000) / 10000,
            region: String(region),
            salesperson: String(salesperson),
            channel: String(channel)
          };
        });

        setSalesData(mappedRecords);
        setIsSampleLoaded(false);
        setImportError(null);
      } catch (err: any) {
        console.error(err);
        setImportError(err.message || 'Failed to parse file. Ensure it is a valid Excel or CSV sheet.');
      }
    };

    reader.onerror = () => {
      setImportError('File system error reading document.');
    };

    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Helper to generate and download a standard clean Excel-compatible CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Product Name',
      'Category',
      'Quantity',
      'Unit Price',
      'Unit Cost',
      'Gross Revenue',
      'Goods Cost',
      'Net Profit',
      'Region',
      'Sales Representative',
      'Sales Channel'
    ];
    
    const rows = [
      ['TX-9901', '2026-01-15', 'Apex Laptop Pro 15', 'Technology', 2, 1250, 850, 2500, 1700, 800, 'North America', 'Sarah Jenkins', 'Direct Sales'],
      ['TX-9902', '2026-01-18', 'AeroGlide Ergonomic Office Chair', 'Furniture', 5, 320, 180, 1600, 900, 700, 'Europe', 'Emma Watson', 'Wholesale'],
      ['TX-9903', '2026-01-20', 'UltraWhite Premium Copy Paper', 'Office Supplies', 10, 45, 18, 450, 180, 270, 'Asia-Pacific', 'Yuki Tanaka', 'Online Store']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sales_Dashboard_Ingest_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFilteredActive = useMemo(() => {
    return (
      filters.region !== 'All' ||
      filters.category !== 'All' ||
      filters.channel !== 'All' ||
      filters.salesperson !== 'All' ||
      filters.startDate !== filterOptions.minDate ||
      filters.endDate !== filterOptions.maxDate
    );
  }, [filters, filterOptions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. TOP UTILITY HEADER BRAND BAR */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Apex Sales Performance</h1>
                <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                  BI System
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Power BI & Excel Inspired Analytics Dashboard</p>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 border border-dashed rounded-lg cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <div className="text-left">
                <div className="text-[11px] font-bold text-slate-700">Import Excel or CSV</div>
                <div className="text-[9px] text-slate-400">Drag or click to map columns</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Template & Reset controls */}
            <div className="flex gap-1.5">
              <button
                id="btn-download-template"
                onClick={handleDownloadTemplate}
                title="Download template file layout description"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors bg-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              
              {!isSampleLoaded && (
                <button
                  id="btn-reset-sample"
                  onClick={() => {
                    setSalesData(initialData);
                    setIsSampleLoaded(true);
                    setImportError(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/20 text-indigo-600 hover:text-indigo-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-pulse" />
                  <span>Use Sample Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Error banner */}
        {importError && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5 text-rose-750 text-xs">
            <span className="p-0.5 px-1.5 bg-rose-100 rounded font-bold text-[10px]">!</span>
            <div>
              <p className="font-bold">Ingest Column Mapping Error</p>
              <p className="mt-0.5 text-rose-600">{importError}</p>
            </div>
          </div>
        )}

        {/* 2. POWER BI STYLE INTERACTIVE SLICERS PANEL */}
        <div id="filter-slicers-box" className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Interactive Slicers (Power BI Panels)</h2>
            </div>
            
            {isFilteredActive && (
              <button
                id="btn-clear-slicers"
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 underline decoration-dotted underline-offset-4 cursor-pointer"
              >
                Clear all slicers
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Slicer 1: Timeline Dates */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                id="filter-start-date"
                type="date"
                min={filterOptions.minDate}
                max={filterOptions.maxDate}
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>End Date</span>
              </label>
              <input
                id="filter-end-date"
                type="date"
                min={filterOptions.minDate}
                max={filterOptions.maxDate}
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Slicer 2: Region Filter */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Region</span>
              </label>
              <select
                id="filter-region-select"
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {filterOptions.regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Slicer 3: Product Category */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Category</span>
              </label>
              <select
                id="filter-category-select"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Slicer 4: Sales Channel */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Sales Channel</span>
              </label>
              <select
                id="filter-channel-select"
                value={filters.channel}
                onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {filterOptions.channels.map((chan) => (
                  <option key={chan} value={chan}>{chan}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. WORKSPACE CORE KPI METRIC CARDS */}
        <KPICards metrics={metricsSummary} isFiltered={isFilteredActive} />

        {/* 4. WORKSPACE DASHBOARD GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* LEFT 2/3 COLUMN: CHARTS & EXCEL TABLE GRID */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Charts Container */}
            <SalesCharts data={filteredSalesData} />

            {/* Interactive Ledger Transaction Sheet */}
            <DataGrid data={filteredSalesData} />

          </div>

          {/* RIGHT 1/3 COLUMN: AI SALES STRATEGIC REVIEWS */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <AIAnalyst data={filteredSalesData} />
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 mt-auto bg-white border-t border-slate-200 text-center text-slate-400">
        <div className="max-w-7xl mx-auto px-4 text-[10px] font-medium space-y-0.5">
          <p>Apex Sales Performance Dashboard • Constructed with React, Tailwind & Google Gemini AI</p>
          <p className="text-slate-350">Inspired by corporate Excel ledgers and Power BI slicer workspaces.</p>
        </div>
      </footer>

    </div>
  );
}

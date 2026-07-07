/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SalesRecord } from '../types';
import { TrendingUp, Award, MapPin, Layers, ShoppingBag } from 'lucide-react';

interface SalesChartsProps {
  data: SalesRecord[];
}

export default function SalesCharts({ data }: SalesChartsProps) {
  // Aggregate data for the charts
  const aggregations = useMemo(() => {
    const monthlyMap: Record<string, { month: string; rawMonth: string; revenue: number; profit: number; units: number }> = {};
    const categoryMap: Record<string, { name: string; revenue: number; profit: number; units: number }> = {};
    const regionMap: Record<string, { name: string; revenue: number; profit: number; units: number }> = {};
    const salespersonMap: Record<string, { name: string; region: string; revenue: number; profit: number; units: number }> = {};
    const productMap: Record<string, { name: string; category: string; revenue: number; profit: number; quantity: number }> = {};
    const channelMap: Record<string, { name: string; revenue: number; profit: number; orders: number }> = {};

    // Standard month names helper
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach((rec) => {
      // 1. Monthly (using Date YYYY-MM)
      const date = new Date(rec.date);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthKey = `${year}-${(monthIdx + 1).toString().padStart(2, '0')}`;
      const monthLabel = `${monthNames[monthIdx]} '${String(year).slice(-2)}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthLabel, rawMonth: monthKey, revenue: 0, profit: 0, units: 0 };
      }
      monthlyMap[monthKey].revenue += rec.revenue;
      monthlyMap[monthKey].profit += rec.profit;
      monthlyMap[monthKey].units += rec.quantity;

      // 2. Category
      if (!categoryMap[rec.category]) {
        categoryMap[rec.category] = { name: rec.category, revenue: 0, profit: 0, units: 0 };
      }
      categoryMap[rec.category].revenue += rec.revenue;
      categoryMap[rec.category].profit += rec.profit;
      categoryMap[rec.category].units += rec.quantity;

      // 3. Region
      if (!regionMap[rec.region]) {
        regionMap[rec.region] = { name: rec.region, revenue: 0, profit: 0, units: 0 };
      }
      regionMap[rec.region].revenue += rec.revenue;
      regionMap[rec.region].profit += rec.profit;
      regionMap[rec.region].units += rec.quantity;

      // 4. Salesperson
      if (!salespersonMap[rec.salesperson]) {
        salespersonMap[rec.salesperson] = { name: rec.salesperson, region: rec.region, revenue: 0, profit: 0, units: 0 };
      }
      salespersonMap[rec.salesperson].revenue += rec.revenue;
      salespersonMap[rec.salesperson].profit += rec.profit;
      salespersonMap[rec.salesperson].units += rec.quantity;

      // 5. Product
      if (!productMap[rec.product]) {
        productMap[rec.product] = { name: rec.product, category: rec.category, revenue: 0, profit: 0, quantity: 0 };
      }
      productMap[rec.product].revenue += rec.revenue;
      productMap[rec.product].profit += rec.profit;
      productMap[rec.product].quantity += rec.quantity;

      // 6. Channel
      if (!channelMap[rec.channel]) {
        channelMap[rec.channel] = { name: rec.channel, revenue: 0, profit: 0, orders: 0 };
      }
      channelMap[rec.channel].revenue += rec.revenue;
      channelMap[rec.channel].profit += rec.profit;
      channelMap[rec.channel].orders += 1;
    });

    // Format and Sort
    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
        margin: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0,
      }));

    const categoryBreakdown = Object.values(categoryMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
        margin: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const regionalBreakdown = Object.values(regionMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const salespersonBreakdown = Object.values(salespersonMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 reps

    const topProducts = Object.values(productMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products

    const channelBreakdown = Object.values(channelMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      monthlyTrend,
      categoryBreakdown,
      regionalBreakdown,
      salespersonBreakdown,
      topProducts,
      channelBreakdown,
    };
  }, [data]);

  // Styling and Colors
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];

  const formatCurrencyLabel = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const customTooltipFormatter = (value: any) => {
    return [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value)), ''];
  };

  return (
    <div className="space-y-6">
      {/* ROW 1: Monthly Sales & Profit Trend (Full Width) */}
      <div id="chart-monthly-trend" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Monthly Revenue Analytics</h3>
            <p className="text-xs text-slate-400">Trend analysis over the active fiscal timeline</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Current Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Target Profit</span>
          </div>
        </div>
        <div className="h-80 w-full">
          {aggregations.monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-medium">No sales transactions match your active filter settings.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregations.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCurrencyLabel} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={customTooltipFormatter} 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                <Area name="Gross Revenue" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area name="Net Profit" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ROW 2: Two Columns - Category Share & Regional Revenue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Share Donut */}
        <div id="chart-category-share" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Category Share & Margin</h3>
              <p className="text-xs text-slate-400">Distribution performance by active segment</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around h-64">
            {aggregations.categoryBreakdown.length === 0 ? (
              <div className="text-slate-400 font-medium">No category breakdown available.</div>
            ) : (
              <>
                <div className="h-44 w-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregations.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="revenue"
                      >
                        {aggregations.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={customTooltipFormatter}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Absolute Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold tracking-wider text-slate-450 uppercase">Product</span>
                    <span className="text-sm font-extrabold text-slate-700">Mix</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 space-y-2.5 w-full sm:w-1/2 px-2">
                  {aggregations.categoryBreakdown.map((item, index) => {
                    const totalRev = aggregations.categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0);
                    const percent = totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="flex flex-col">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500">{percent}% share</span>
                        </div>
                        {/* Margin bar indicator */}
                        <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              backgroundColor: COLORS[index % COLORS.length],
                              width: `${percent}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-0.5">
                          <span>Margin: {item.margin}%</span>
                          <span>Vol: {item.units} units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Regional Grouped Bar */}
        <div id="chart-regional-performance" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Regional Performance</h3>
              <p className="text-xs text-slate-400">Total gross and net margins by territory</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {aggregations.regionalBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No regional breakdown available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregations.regionalBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatCurrencyLabel} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={customTooltipFormatter}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name="Gross Revenue" dataKey="revenue" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={30} />
                  <Bar name="Net Profit" dataKey="profit" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Two Columns - Top Products (Leaderboard style) & Sales Channels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products Horizontal Bars */}
        <div id="chart-top-products" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top 5 Products by Revenue</h3>
              <p className="text-xs text-slate-400">Product performance ranked by total sales value</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {aggregations.topProducts.length === 0 ? (
              <div className="text-slate-400 font-medium text-center py-10">No top products data.</div>
            ) : (
              aggregations.topProducts.map((p, idx) => {
                const maxRevenue = aggregations.topProducts[0]?.revenue || 1;
                const percent = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={p.name} className="flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 font-bold rounded bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-[300px]">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-right font-bold text-slate-800 font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.revenue)}
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Category: {p.category}</span>
                      <span className="font-mono">Profit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.profit)} ({p.quantity} units)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Sales Representatives & Channels Distribution */}
        <div id="chart-salesperson-leaderboard" className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top Sales Representatives</h3>
              <p className="text-xs text-slate-400">Ranked by revenue contributed with regional context</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {aggregations.salespersonBreakdown.length === 0 ? (
              <div className="text-slate-400 font-medium text-center py-10">No salesperson performance data.</div>
            ) : (
              aggregations.salespersonBreakdown.map((s, idx) => {
                const maxRevenue = aggregations.salespersonBreakdown[0]?.revenue || 1;
                const percent = (s.revenue / maxRevenue) * 100;
                return (
                  <div key={s.name} className="flex flex-col">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 font-bold rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {s.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-wider">
                          {s.region}
                        </span>
                      </div>
                      <div className="text-right font-bold text-slate-800 font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s.revenue)}
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Total Revenue Goal Contributor</span>
                      <span className="font-mono">Profit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s.profit)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

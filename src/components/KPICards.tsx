/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Percent, Info } from 'lucide-react';
import { MetricSummary } from '../types';

interface KPICardsProps {
  metrics: MetricSummary;
  isFiltered: boolean;
}

export default function KPICards({ metrics, isFiltered }: KPICardsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const cards = [
    {
      id: 'kpi-revenue',
      title: 'Gross Revenue',
      value: formatCurrency(metrics.totalRevenue),
      subtitle: `${formatNumber(metrics.recordCount)} Transactions`,
      isHighlighted: false,
      color: 'text-slate-900',
      description: 'Total revenue generated from all sales channels before product costs.',
    },
    {
      id: 'kpi-profit',
      title: 'Net Profit',
      value: formatCurrency(metrics.totalProfit),
      subtitle: `${(metrics.avgMargin * 100).toFixed(1)}% Avg Margin`,
      isHighlighted: false,
      color: 'text-slate-800',
      description: 'Gross revenue minus cost of goods sold (COGS). Indicative of bottom-line profitability.',
    },
    {
      id: 'kpi-volume',
      title: 'Units Sold',
      value: formatNumber(metrics.totalUnitsSold),
      subtitle: `${(metrics.totalUnitsSold / Math.max(1, metrics.recordCount)).toFixed(1)} Units / Order`,
      isHighlighted: false,
      color: 'text-slate-900',
      description: 'Aggregate quantity of physical products shipped across all transactions.',
    },
    {
      id: 'kpi-aov',
      title: 'Average Order Value',
      value: formatCurrency(metrics.avgOrderValue),
      subtitle: 'Average ticket size',
      isHighlighted: true,
      color: 'text-white',
      description: 'The average revenue generated per individual sales transaction.',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        return (
          <div
            id={card.id}
            key={card.title}
            className={`relative flex flex-col justify-between p-4 border rounded-xl shadow-xs transition-all duration-200 group ${
              card.isHighlighted
                ? 'bg-indigo-900 border-indigo-950 text-white shadow-xs shadow-indigo-100'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
            }`}
          >
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  card.isHighlighted ? 'text-indigo-300' : 'text-slate-400'
                }`}
              >
                {card.title}
              </p>
              
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-mono font-bold tracking-tight ${card.color}`}>
                  {card.value}
                </span>
                
                {isFiltered && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      card.isHighlighted
                        ? 'bg-indigo-800/60 text-indigo-200 border border-indigo-700/50'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    Filter
                  </span>
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-between mt-3 pt-3 border-t text-xs font-medium ${
                card.isHighlighted ? 'border-indigo-800/80 text-indigo-200' : 'border-slate-100 text-slate-500'
              }`}
            >
              <span>{card.subtitle}</span>
            </div>

            {/* Information Indicator */}
            <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="relative group/tooltip">
                <Info className={`w-3.5 h-3.5 ${card.isHighlighted ? 'text-indigo-400' : 'text-slate-300'}`} />
                <div className="absolute bottom-full right-0 z-10 hidden group-hover/tooltip:block w-48 p-2 mb-1 text-2xs text-white bg-slate-800 border border-slate-700 rounded shadow-lg">
                  {card.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

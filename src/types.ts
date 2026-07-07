/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SalesRecord {
  id: string | number;
  date: string; // YYYY-MM-DD
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number; // profit / revenue
  region: string;
  salesperson: string;
  channel: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  region: string; // "All" or value
  category: string; // "All" or value
  channel: string; // "All" or value
  salesperson: string; // "All" or value
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIAnalysisSummary {
  executiveSummary: string;
  keyInsights: string[];
  recommendations: string[];
}

export interface MetricSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMargin: number;
  totalUnitsSold: number;
  avgOrderValue: number;
  recordCount: number;
}

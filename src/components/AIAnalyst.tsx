/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Send, Play, MessageSquare, FileText, AlertCircle, HelpCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { SalesRecord, ChatMessage, AIAnalysisSummary, MetricSummary } from '../types';

interface AIAnalystProps {
  data: SalesRecord[];
}

export default function AIAnalyst({ data }: AIAnalystProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
  
  // Report Generation States
  const [report, setReport] = useState<AIAnalysisSummary | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your Apex Sales Intelligence analyst. I can help you deep-dive into your monthly sales performance, outline forecasting projections, recommend pricing optimizations, or diagnose margin concerns. Ask me anything about your active sales dataset!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Aggregate metrics on the client-side to minimize API payload size and optimize speed
  const aggregatedContext = useMemo(() => {
    const recordCount = data.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;

    const categoryMap: Record<string, { name: string; revenue: number; profit: number; units: number }> = {};
    const productMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};
    const regionMap: Record<string, { name: string; revenue: number; profit: number }> = {};
    const monthlyMap: Record<string, { month: string; revenue: number; profit: number }> = {};

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach((rec) => {
      totalRevenue += rec.revenue;
      totalCost += rec.cost;
      totalProfit += rec.profit;
      totalUnitsSold += rec.quantity;

      // Category
      if (!categoryMap[rec.category]) {
        categoryMap[rec.category] = { name: rec.category, revenue: 0, profit: 0, units: 0 };
      }
      categoryMap[rec.category].revenue += rec.revenue;
      categoryMap[rec.category].profit += rec.profit;
      categoryMap[rec.category].units += rec.quantity;

      // Product
      if (!productMap[rec.product]) {
        productMap[rec.product] = { name: rec.product, quantity: 0, revenue: 0, profit: 0 };
      }
      productMap[rec.product].quantity += rec.quantity;
      productMap[rec.product].revenue += rec.revenue;
      productMap[rec.product].profit += rec.profit;

      // Region
      if (!regionMap[rec.region]) {
        regionMap[rec.region] = { name: rec.region, revenue: 0, profit: 0 };
      }
      regionMap[rec.region].revenue += rec.revenue;
      regionMap[rec.region].profit += rec.profit;

      // Monthly
      const date = new Date(rec.date);
      const mKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { month: mLabel, revenue: 0, profit: 0 };
      }
      monthlyMap[mKey].revenue += rec.revenue;
      monthlyMap[mKey].profit += rec.profit;
    });

    const categories = Object.values(categoryMap).map(c => ({
      ...c,
      margin: c.revenue > 0 ? c.profit / c.revenue : 0
    }));

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const regions = Object.values(regionMap);

    const monthlyTrend = Object.keys(monthlyMap)
      .sort()
      .map(key => ({
        month: monthlyMap[key].month,
        revenue: Math.round(monthlyMap[key].revenue),
        profit: Math.round(monthlyMap[key].profit)
      }));

    const metrics: MetricSummary = {
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin: totalRevenue > 0 ? totalProfit / totalRevenue : 0,
      totalUnitsSold,
      avgOrderValue: recordCount > 0 ? totalRevenue / recordCount : 0,
      recordCount
    };

    return {
      metrics,
      categories,
      topProducts,
      regions,
      monthlyTrend
    };
  }, [data]);

  // Reset report if active dataset size changes significantly
  useEffect(() => {
    setReport(null);
    setReportError(null);
  }, [data.length]);

  const handleGenerateReport = async () => {
    if (data.length === 0) {
      setReportError('Cannot generate analysis without sales transactions.');
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aggregatedContext),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error generating analysis.');
      }

      const reportData = await res.json();
      setReport(reportData);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || 'Failed to connect to the Gemini API. Please ensure your GEMINI_API_KEY is configured in Settings > Secrets.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText) return;

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSendingMessage(true);
    setChatError(null);

    try {
      const promptHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: promptHistory,
          context: aggregatedContext
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server encountered an error processing chat.');
      }

      const replyData = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: replyData.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || 'Failed to send chat message. Please confirm your server and API keys are online.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const quickPrompts = [
    'Project a 3-month sales forecast based on timeline trends',
    'Which product category is most profitable and what are its drivers?',
    'What pricing or marketing adjustments can improve our lowest margin items?',
    'Give me a regional breakdown identifying our highest growth market opportunities',
  ];

  return (
    <div className="flex flex-col h-[650px] bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden text-slate-900">
      {/* Tab Select Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sales Intelligence AI</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            id="tab-ai-report"
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Report</span>
          </button>
          <button
            id="tab-ai-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 overflow-y-auto p-5 bg-white">
        {activeTab === 'report' ? (
          /* TAB 1: EXECUTIVE ANALYSIS REPORT */
          <div className="h-full flex flex-col justify-between">
            {!report && !isGeneratingReport && (
              <div className="flex flex-col items-stretch justify-center my-auto space-y-4">
                {/* Embedded Prediction Engine Promo Card as requested by Design HTML */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-900">AI Prediction Engine</h3>
                      <p className="text-[10px] text-indigo-700 opacity-70">Forecast for subsequent periods</p>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Apex system uses Gemini 3.5 Flash to automatically detect seasonal trends, regional variations, and pricing margins based on your active dataset.
                  </p>
                  <div className="mt-3 pt-3 border-t border-indigo-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Confidence Score</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600">92%</span>
                  </div>
                </div>

                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Generate a full Executive Briefing covering seasonal growth multipliers, top revenue pillars, and actionable profit improvements.
                  </p>
                  <button
                    id="btn-run-ai-analysis"
                    onClick={handleGenerateReport}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Full Executive Briefing</span>
                  </button>
                </div>
              </div>
            )}

            {isGeneratingReport && (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-4 py-12">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <div className="absolute inset-0 m-auto w-3 h-3 bg-indigo-600 rounded-full animate-ping opacity-75"></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aggregating Metric Framework...</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Calling Gemini AI to calculate key variables</p>
                </div>
              </div>
            )}

            {reportError && (
              <div className="my-auto p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-rose-800">AI Deep Dive Unavailable</h5>
                  <p className="text-[11px] text-rose-700 leading-relaxed">{reportError}</p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    To resolve, make sure you configure your <span className="font-bold text-slate-600 font-mono">GEMINI_API_KEY</span> in the Secrets menu.
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-bold pt-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                </div>
              </div>
            )}

            {report && (
              <div className="space-y-4 animate-fade-in pb-2">
                {/* Action header to re-run */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AI Generated Executive Summary</span>
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 text-xs font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Executive Summary Card */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Executive Briefing</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{report.executiveSummary}</p>
                </div>

                <div className="space-y-3">
                  {/* Key Insights Grid */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>Key Financial Drivers</span>
                    </h4>
                    <ul className="space-y-2">
                      {report.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-normal">
                          <span className="text-indigo-600 font-bold font-mono shrink-0">{String(idx + 1).padStart(2, '0')}.</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations Grid */}
                  <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-xl">
                    <h4 className="text-[10px] font-bold text-indigo-900 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Recommended Strategic Actions</span>
                    </h4>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-indigo-950 leading-relaxed font-normal">
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-[9px] font-bold shrink-0 mt-0.5 font-mono">
                            ✓
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: INTERACTIVE CHAT ASSISTANT */
          <div className="flex flex-col h-full justify-between">
            {/* Scrollable message box */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[400px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-indigo-600 border border-slate-200'
                    }`}
                  >
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none font-normal shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none font-normal'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div
                      className={`text-[9px] mt-1 font-mono ${
                        msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {isSendingMessage && (
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-slate-100 text-indigo-600 border border-slate-200">
                    AI
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span className="text-[10px] font-mono">Analyzing sales records...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2 max-w-[85%]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-bold">Chat Error:</span> {chatError}
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts & Input Bar */}
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
              {/* Prompt chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-0.5 mr-1 uppercase">
                  <HelpCircle className="w-3 h-3" />
                  <span>Try:</span>
                </span>
                {quickPrompts.map((pText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(pText)}
                    disabled={isSendingMessage}
                    className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 rounded text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {pText.length > 30 ? pText.slice(0, 27) + '...' : pText}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="relative">
                <input
                  id="chat-user-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSendingMessage) {
                      handleSendMessage(inputValue);
                    }
                  }}
                  disabled={isSendingMessage}
                  placeholder="Ask about forecast, lowest margins..."
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-450 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all disabled:opacity-50"
                />
                <button
                  id="chat-send-button"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isSendingMessage || !inputValue.trim()}
                  className="absolute inset-y-1 right-1 flex items-center justify-center w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

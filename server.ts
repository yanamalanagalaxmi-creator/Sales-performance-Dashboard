/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables from .env
dotenv.config();

const PORT = 3000;
const app = express();

// Enable JSON body parser with comfortable limit
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gen AI client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for generating executive analysis report
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { metrics, categories, topProducts, regions, monthlyTrend } = req.body;
    
    if (!metrics) {
      res.status(400).json({ error: 'Missing sales metrics for analysis.' });
      return;
    }

    const ai = getAIClient();

    const prompt = `You are a world-class Chief Revenue Officer and senior Business Intelligence Consultant.
Analyze the following sales dashboard metrics and generate a high-impact, professional executive sales report.

Active Sales Metrics:
- Total Transactions: ${metrics.recordCount}
- Total Revenue: $${metrics.totalRevenue.toLocaleString()}
- Total Cost: $${metrics.totalCost.toLocaleString()}
- Total Profit: $${metrics.totalProfit.toLocaleString()}
- Average Profit Margin: ${(metrics.avgMargin * 100).toFixed(2)}%
- Total Units Sold: ${metrics.totalUnitsSold.toLocaleString()}
- Average Transaction Value: $${metrics.avgOrderValue.toLocaleString()}

Sales by Product Category:
${categories.map((c: any) => `- ${c.name}: $${c.revenue.toLocaleString()} Revenue, $${c.profit.toLocaleString()} Profit (${(c.margin * 100).toFixed(1)}% Margin)`).join('\n')}

Top Performing Products:
${topProducts.map((p: any) => `- ${p.name}: ${p.quantity} units, $${p.revenue.toLocaleString()} Revenue, $${p.profit.toLocaleString()} Profit`).join('\n')}

Regional Contribution:
${regions.map((r: any) => `- ${r.name}: $${r.revenue.toLocaleString()} Revenue, $${r.profit.toLocaleString()} Profit`).join('\n')}

Monthly Sales Trend (Full Timeline):
${monthlyTrend.map((m: any) => `- ${m.month}: $${m.revenue.toLocaleString()} Revenue, $${m.profit.toLocaleString()} Profit`).join('\n')}

Please return your response in clean JSON format matching the schema below. Provide a deeply analytical review of trends, highlights, potential issues, and strategic recommendations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'An executive, highly professional overview of the current performance, growth trajectory, and health of sales.'
            },
            keyInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'At least 4 deep insights calling out specific product category margins, seasonal spikes, regional strengths, or channel efficiencies.'
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'At least 4 actionable executive recommendations regarding inventory management, pricing strategies, market expansion, or sales training.'
            }
          },
          required: ['executiveSummary', 'keyInsights', 'recommendations']
        }
      }
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error('Gemini returned an empty response.');
    }

    res.json(JSON.parse(reportText.trim()));
  } catch (error: any) {
    console.error('API Error in /api/analyze:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI insights.' });
  }
});

// API endpoint for interactive chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing or malformed messages parameter.' });
      return;
    }

    const ai = getAIClient();
    const metrics = context?.metrics;
    const categories = context?.categories || [];
    const topProducts = context?.topProducts || [];
    const regions = context?.regions || [];

    const systemInstruction = `You are "Apex Sales Intelligence", an expert AI Business Analyst and Strategic Chief Revenue Officer.
Your objective is to help business owners, managers, and executives interpret their sales data. 
Be highly data-driven, strategic, clear, and actionable. Avoid software developer terminology (like databases, schemas, arrays, strings). Instead, speak in financial and business terminology (e.g., Year-over-Year, profit margin, product mix, average order value, customer acquisition, operational leverage).

Here is a summary of the ACTIVE sales dataset loaded by the user:
- Total Sales Transactions: ${metrics?.recordCount || 0}
- Total Gross Revenue: $${(metrics?.totalRevenue || 0).toLocaleString()}
- Total Goods Cost: $${(metrics?.totalCost || 0).toLocaleString()}
- Net Profit: $${(metrics?.totalProfit || 0).toLocaleString()}
- Net Profit Margin: ${((metrics?.avgMargin || 0) * 100).toFixed(2)}%
- Total Units Sold: ${(metrics?.totalUnitsSold || 0).toLocaleString()}
- Average Transaction Size: $${(metrics?.avgOrderValue || 0).toLocaleString()}

Category Breakdown:
${categories.map((c: any) => `- ${c.name}: $${c.revenue.toLocaleString()} Revenue, ${(c.margin * 100).toFixed(1)}% Profit Margin`).join('\n')}

Top Products Leaderboard:
${topProducts.map((p: any) => `- ${p.name}: ${p.quantity} units, $${p.revenue.toLocaleString()} Revenue`).join('\n')}

Regional Performance:
${regions.map((r: any) => `- ${r.name}: $${r.revenue.toLocaleString()}`).join('\n')}

Guidelines:
1. Always base your analysis on the ACTIVE dataset summarized above. If the user asks general sales questions, connect them back to their specific figures to prove your analytical accuracy.
2. If the user asks for a forecast, project a realistic growth scenario based on their monthly numbers, category strengths, or seasonal trends.
3. Be friendly but executive and highly objective in your tone.`;

    // Map conversation messages to Gemini contents structure
    const chatContents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ content: response.text || "I was unable to analyze that request. Could you provide more details?" });
  } catch (error: any) {
    console.error('API Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Error occurred in AI Chat.' });
  }
});

// Configure Vite middleware and static asset serving
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support single page application fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();

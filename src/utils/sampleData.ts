/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesRecord } from '../types';

// Deterministic pseudo-random number generator to ensure consistent sample data across reloads
function createRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleSalesData(): SalesRecord[] {
  const rand = createRandom(12345);
  
  const regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America'];
  const channels = ['Online Store', 'Direct Sales', 'Wholesale', 'Distributor'];
  
  const salespersonsByRegion: Record<string, string[]> = {
    'North America': ['Sarah Jenkins', 'David Miller', 'Michael Chang'],
    'Europe': ['Emma Watson', 'Hans Schmidt', 'Jean-Pierre'],
    'Asia-Pacific': ['Yuki Tanaka', 'Rajesh Kumar', 'Wei Chen'],
    'Latin America': ['Carlos Gomez', 'Isabella Silva', 'Mateo Rossi']
  };

  interface ProductConfig {
    name: string;
    category: string;
    unitPrice: number;
    unitCost: number;
    monthlyModifier: number[]; // Index 0-11 for seasonal multiplier
  }

  const products: ProductConfig[] = [
    // Technology
    { name: 'Apex Laptop Pro 15', category: 'Technology', unitPrice: 1250, unitCost: 850, monthlyModifier: [1.0, 0.9, 0.95, 1.1, 1.05, 1.1, 1.0, 0.95, 1.1, 1.2, 1.3, 1.5] },
    { name: 'UltraSync Curved Monitor 34', category: 'Technology', unitPrice: 550, unitCost: 350, monthlyModifier: [0.95, 0.95, 1.0, 1.0, 1.0, 1.05, 0.95, 1.0, 1.1, 1.1, 1.25, 1.4] },
    { name: 'ErgoMech Wireless Keyboard', category: 'Technology', unitPrice: 120, unitCost: 65, monthlyModifier: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2] },
    { name: 'Precision Wireless Mouse', category: 'Technology', unitPrice: 75, unitCost: 32, monthlyModifier: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2] },
    { name: 'Multiport Thunderbolt Dock', category: 'Technology', unitPrice: 180, unitCost: 105, monthlyModifier: [0.9, 0.95, 1.0, 1.0, 1.05, 1.0, 0.95, 1.0, 1.1, 1.15, 1.2, 1.3] },
    
    // Furniture
    { name: 'AeroGlide Ergonomic Office Chair', category: 'Furniture', unitPrice: 320, unitCost: 180, monthlyModifier: [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 1.0, 1.1, 1.15, 1.0, 0.95] },
    { name: 'FlexiRise Electric Standing Desk', category: 'Furniture', unitPrice: 580, unitCost: 310, monthlyModifier: [1.15, 1.1, 1.0, 0.9, 0.85, 0.85, 0.9, 1.0, 1.1, 1.15, 1.0, 0.95] },
    { name: 'StowAway 3-Drawer Cabinet', category: 'Furniture', unitPrice: 150, unitCost: 85, monthlyModifier: [1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0] },
    { name: 'DualMonitor Gas-Spring Arm', category: 'Furniture', unitPrice: 140, unitCost: 75, monthlyModifier: [1.0, 1.05, 1.0, 1.0, 1.0, 1.0, 0.95, 1.0, 1.05, 1.1, 1.15, 1.25] },
    
    // Office Supplies
    { name: 'UltraWhite Premium Copy Paper (Box)', category: 'Office Supplies', unitPrice: 45, unitCost: 18, monthlyModifier: [1.2, 1.1, 1.0, 1.0, 0.95, 0.9, 0.85, 1.0, 1.1, 1.1, 1.0, 0.9] },
    { name: 'EcoScribe Refillable Notebooks (Pack of 5)', category: 'Office Supplies', unitPrice: 28, unitCost: 11, monthlyModifier: [1.1, 1.0, 1.0, 1.0, 1.0, 0.9, 0.85, 1.1, 1.25, 1.1, 1.0, 0.95] },
    { name: 'Glass Surface Magnetic Whiteboard', category: 'Office Supplies', unitPrice: 110, unitCost: 55, monthlyModifier: [1.0, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 1.0, 1.15, 1.1, 1.0, 0.9] },
    { name: 'HeavyDuty Steel Desk Stapler', category: 'Office Supplies', unitPrice: 35, unitCost: 15, monthlyModifier: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] },
    
    // Electronics
    { name: 'CineMedia 4K Smart Projector', category: 'Electronics', unitPrice: 750, unitCost: 480, monthlyModifier: [0.9, 0.85, 0.9, 1.0, 1.0, 1.05, 1.0, 1.0, 1.1, 1.25, 1.45, 1.7] },
    { name: 'SonicShield Active Noise Headphones', category: 'Electronics', unitPrice: 240, unitCost: 130, monthlyModifier: [1.0, 0.95, 1.0, 1.0, 1.05, 1.1, 1.05, 1.1, 1.15, 1.2, 1.35, 1.6] },
    { name: 'OmniVoice BT Speakerphone', category: 'Electronics', unitPrice: 160, unitCost: 90, monthlyModifier: [0.95, 1.0, 1.0, 1.0, 1.05, 1.05, 0.95, 1.0, 1.1, 1.15, 1.2, 1.3] },
    { name: 'VisionHD 1080p Smart Webcam', category: 'Electronics', unitPrice: 90, unitCost: 45, monthlyModifier: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.05, 1.1, 1.15, 1.2] }
  ];

  const records: SalesRecord[] = [];
  let recordId = 1001;

  // Generate records from Jan 2025 to June 2026 (18 months)
  const years = [2025, 2026];
  
  for (const year of years) {
    const endMonth = year === 2026 ? 6 : 12; // up to June 2026
    
    for (let month = 1; month <= endMonth; month++) {
      const monthIndex = month - 1;
      
      // Number of orders in this month (adds variation plus seasonal bump in holiday season Nov/Dec)
      let baseOrdersCount = 18;
      if (month === 11) baseOrdersCount = 24; // Nov bump
      if (month === 12) baseOrdersCount = 32; // Dec bump
      if (month === 1) baseOrdersCount = 15; // Jan dip
      
      const ordersCount = Math.floor(baseOrdersCount + rand() * 10);
      
      for (let o = 0; o < ordersCount; o++) {
        // Pick random product
        const prod = products[Math.floor(rand() * products.length)];
        
        // Product specific modifications / seasonal modifiers
        const seasonalModifier = prod.monthlyModifier[monthIndex];
        
        // Random day
        const maxDay = month === 2 ? 28 : [4, 6, 9, 11].includes(month) ? 30 : 31;
        const day = Math.floor(rand() * maxDay) + 1;
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Random region
        const region = regions[Math.floor(rand() * regions.length)];
        
        // Salesperson for that region
        const salespeople = salespersonsByRegion[region];
        const salesperson = salespeople[Math.floor(rand() * salespeople.length)];
        
        // Random channel
        const channel = channels[Math.floor(rand() * channels.length)];
        
        // Random quantity (with higher volumes for wholesale/distributor)
        let baseQty = 1;
        if (channel === 'Wholesale') {
          baseQty = Math.floor(3 + rand() * 8);
        } else if (channel === 'Distributor') {
          baseQty = Math.floor(5 + rand() * 15);
        } else {
          baseQty = Math.floor(1 + rand() * 3);
        }
        
        // Apply seasonal multiplier to quantity or keep within bounds
        const qty = Math.max(1, Math.round(baseQty * seasonalModifier));
        
        // Introduce small price variations (discounts or wholesale pricing)
        let priceMultiplier = 1.0;
        if (channel === 'Wholesale') priceMultiplier = 0.85; // 15% discount
        if (channel === 'Distributor') priceMultiplier = 0.75; // 25% discount
        // Minor random noise (+/- 3%)
        priceMultiplier += (rand() * 0.06 - 0.03);
        
        const unitPrice = Math.round(prod.unitPrice * priceMultiplier * 100) / 100;
        const unitCost = prod.unitCost;
        
        const revenue = Math.round(qty * unitPrice * 100) / 100;
        const cost = Math.round(qty * unitCost * 100) / 100;
        const profit = Math.round((revenue - cost) * 100) / 100;
        const margin = Math.round((profit / revenue) * 10000) / 10000;
        
        records.push({
          id: `TX-${recordId++}`,
          date: dateStr,
          product: prod.name,
          category: prod.category,
          quantity: qty,
          unitPrice,
          unitCost,
          revenue,
          cost,
          profit,
          margin,
          region,
          salesperson,
          channel
        });
      }
    }
  }

  // Sort by date ascending
  return records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

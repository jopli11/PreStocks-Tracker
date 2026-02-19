'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface TokenData {
  name: string;
  symbol: string;
  image?: string;
  tokenPrice?: number;
  markPrice?: number;
  impliedValuation?: number;
  markValuation?: number;
  supply?: number;
  contract_address?: string;
  external_url?: string;
}

interface TargetToken {
  key: string;
  match: string[];
}

const TARGETS: TargetToken[] = [
  { key: "Anthropic", match: ["ANTHROPIC", "Anthropic"] },
  { key: "OpenAI", match: ["OPENAI", "OpenAI"] },
  { key: "SpaceX", match: ["SPACEX", "SpaceX"] },
  { key: "Anduril", match: ["ANDURIL", "Anduril"] },
  { key: "Kalshi", match: ["KALSHI", "Kalshi"] },
  { key: "Polymarket", match: ["POLYMARKET", "Polymarket"] },
];

const REFRESH_MS = 60_000;

export default function TokenTicker() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const fmtUsd = (n?: number) => {
    if (n === undefined || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-GB", { 
      style: "currency", 
      currency: "USD", 
      maximumFractionDigits: n < 1 ? 4 : 2 
    });
  };

  const fmtCompact = (n?: number) => {
    if (n === undefined || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-GB", { notation: "compact", maximumFractionDigits: 2 });
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/prestocks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTokens(data);
        setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour12: false }));
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const findToken = (target: TargetToken) => {
    return tokens.find(t => {
      const s = String(t.symbol || "").toUpperCase();
      const n = String(t.name || "").toUpperCase();
      return target.match.some(m => m.toUpperCase() === s || m.toUpperCase() === n);
    });
  };

  const filteredTokens = TARGETS.map(target => ({
    target,
    data: findToken(target)
  })).filter(item => item.data);

  // Create a block: [PreStocks Logo] -> [Tokens] -> [Powered by Solana]
  const tickerBlock = [
    { type: 'brand' as const },
    ...filteredTokens.map(t => ({ type: 'token' as const, ...t })),
    { type: 'solana' as const }
  ];

  // Duplicate for seamless loop
  const tickerItems = [...tickerBlock, ...tickerBlock];

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-white/95 backdrop-blur-xl border-t border-black/5 flex items-center overflow-hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      {/* Fixed Header - Replaced text with Logo */}
      <div className="flex items-center px-6 h-full bg-white z-20 border-r border-black/5 shadow-[15px_0_25px_rgba(255,255,255,0.8)]">
        <Image src="/prestocks-logo.svg" alt="PreStocks" width={100} height={24} className="h-6 w-auto" />
      </div>

      {/* Scrolling Ticker */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="animate-ticker flex items-center h-full">
          {tickerItems.map((item, idx) => {
            if (item.type === 'brand') {
              return (
                <div key={`brand-${idx}`} className="ticker-item px-8 flex items-center">
                  <Image src="/prestocks-logo.svg" alt="PreStocks" width={90} height={20} className="h-5 w-auto" />
                </div>
              );
            }

            if (item.type === 'solana') {
              return (
                <div key={`solana-${idx}`} className="ticker-item px-8 flex items-center">
                  <Image src="/powered-by-solana.svg" alt="Powered by Solana" width={110} height={20} className="h-5 w-auto" />
                </div>
              );
            }

            const price = item.data?.tokenPrice ?? item.data?.markPrice;
            const valuation = item.data?.impliedValuation ?? item.data?.markValuation;
            const supply = item.data?.supply;
            
            // Mocking change for visual bulletin look
            const change = (Math.random() * 6 - 3).toFixed(1); 
            const isPositive = parseFloat(change) >= 0;

            return (
              <div key={`${item.target?.key}-${idx}`} className="ticker-item gap-6">
                {/* Logo & Basic Info */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black/5 border border-black/10 p-0.5 overflow-hidden flex-shrink-0">
                    {item.data?.image && (
                      <img src={item.data.image} alt={item.target?.key} className="w-full h-full object-cover rounded-full" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm tracking-tight leading-none text-black">{item.target?.key}</span>
                    <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">{item.data?.symbol}</span>
                  </div>
                </div>
                
                {/* Price & Change */}
                <div className="flex flex-col items-start">
                  <span className="font-mono font-black text-sm leading-none text-black">{fmtUsd(price)}</span>
                  <span className={`text-[10px] font-black ${isPositive ? 'text-[#00a870]' : 'text-[#e63946]'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(parseFloat(change))}%
                  </span>
                </div>

                {/* Valuation & Supply (Brief Info) */}
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
                  <div className="flex flex-col">
                    <span className="text-black/30 text-[8px] tracking-normal mb-0.5">Valuation</span>
                    <span className="text-black/70">{fmtCompact(valuation)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-black/30 text-[8px] tracking-normal mb-0.5">Supply</span>
                    <span className="text-black/70">{fmtCompact(supply)}</span>
                  </div>
                </div>
                
                {/* Separator */}
                <div className="w-px h-6 bg-black/5 ml-1" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

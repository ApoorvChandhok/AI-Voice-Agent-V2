"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { useAppContext } from "./app-provider";

const CustomTooltipUsage = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1c23] p-4 rounded-xl shadow-2xl border border-gray-700 min-w-[160px] z-50 relative">
        <p className="text-white text-xs font-bold mb-3">{label} 2026</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-300">{entry.name}</span>
              </div>
              <span className="text-white font-bold ml-6">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltipCost = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-[#1a1c23] p-4 rounded-xl shadow-2xl border border-gray-700 min-w-[180px] z-50 relative">
        <p className="text-white text-xs font-bold mb-3">{label} 2026</p>
        <p className="text-gray-400 text-[10px] font-bold mb-2">Breakdown</p>
        <div className="space-y-2 border-b border-gray-700 pb-3 mb-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-300">{entry.name}</span>
              </div>
              <span className="text-white font-bold ml-6">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-white font-bold">Total</span>
          <span className="text-white font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface CostGraphProps {
  logs?: any[];
  customData?: any[];
  type?: "usage" | "cost" | "inboundOutbound" | "default";
}

export default function CostGraph({ logs, customData, type = "default" }: CostGraphProps) {
  const { formatCurrency } = useAppContext();

  if (type === "usage" && customData) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={customData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dx={-10} />
          <Tooltip content={<CustomTooltipUsage />} cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }} />
          <Area type="monotone" dataKey="totalCalls" name="Total Calls" stroke="#22c55e" strokeWidth={2} fillOpacity={0.1} fill="#22c55e" isAnimationActive={false} />
          <Area type="monotone" dataKey="sipTrunk" name="SIP Trunk" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.1} fill="#3b82f6" isAnimationActive={false} />
          <Area type="monotone" dataKey="voiceApi" name="Voice API" stroke="#eab308" strokeWidth={2} fillOpacity={0.1} fill="#eab308" isAnimationActive={false} />
          <Brush dataKey="date" height={15} stroke="#3b82f6" fill="#f8fafc" travellerWidth={8} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "cost" && customData) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={customData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(value) => formatCurrency(value)} dx={-10} />
          <Tooltip content={<CustomTooltipCost formatCurrency={formatCurrency} />} cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }} />
          <Area type="monotone" dataKey="cdr" name="CDR" stackId="1" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.3} fill="#3b82f6" isAnimationActive={false} />
          <Area type="monotone" dataKey="recording" name="Recording" stackId="1" stroke="#fb923c" strokeWidth={2} fillOpacity={0.3} fill="#fb923c" isAnimationActive={false} />
          <Area type="monotone" dataKey="transcription" name="Transcription" stackId="1" stroke="#2dd4bf" strokeWidth={2} fillOpacity={0.3} fill="#2dd4bf" isAnimationActive={false} />
          <Area type="monotone" dataKey="ncc" name="Ncc" stackId="1" stroke="#f87171" strokeWidth={2} fillOpacity={0.3} fill="#f87171" isAnimationActive={false} />
          <Area type="monotone" dataKey="didPurchase" name="DID Purchase" stackId="1" stroke="#c084fc" strokeWidth={2} fillOpacity={0.3} fill="#c084fc" isAnimationActive={false} />
          <Brush dataKey="date" height={15} stroke="#a855f7" fill="#f8fafc" travellerWidth={8} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "inboundOutbound" && customData) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={customData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: "#6b7280" }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: "#6b7280" }} 
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", zIndex: 100 }}
            itemStyle={{ fontSize: "12px", fontWeight: 600 }}
            labelStyle={{ fontSize: "10px", color: "#6b7280", marginBottom: "4px" }}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="inbound" name="Inbound" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="outbound" name="Outbound" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Brush dataKey="date" height={15} stroke="#6b7280" fill="#f8fafc" travellerWidth={8} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div>No Data</div>;
}

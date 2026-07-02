"use client";

import React, { useState } from "react";
import { Activity, Play, Clock, ChevronDown, ChevronUp, FileText } from "lucide-react";
import Link from "next/link";

const AGENT_DID = "918065480288";

function formatCostINR(cost: string | number | undefined): string {
  if (cost == null) return "₹0.00";
  const inr = typeof cost === "number" ? cost : parseFloat(cost.replace(/[^0-9.-]/g, "")) || 0;
  return `₹${inr.toFixed(2)}`;
}

export interface CallLog {
  id?: string;
  caller_number?: string;
  caller_id?: string;
  phone_number?: string;
  timestamp: string | number;
  status?: string;
  direction?: string;
  mode?: string;
  cost?: string | number;
  duration?: number | string;
  mos?: number | string;
  sentiment?: string;
  recording_path?: string;
  sip_call_id?: string;
  user_info?: Record<string, string | number | boolean>;
  caller_intent?: string;
  summary?: string;
  transcript?: string;
  [key: string]: unknown;
}

function getCallerNumber(log: CallLog): string {
  if (log.caller_number) return log.caller_number;
  if (log.caller_id && log.caller_id.replace("+", "") !== AGENT_DID) return log.caller_id;
  if (log.phone_number && log.phone_number.replace("+", "") !== AGENT_DID) return log.phone_number;
  return log.phone_number || "Unknown";
}

export default function CallLogsTable({ logs }: { logs: CallLog[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200/50 dark:border-white/8 bg-white/80 dark:bg-[#161b22]/60 backdrop-blur-md shadow-sm flex-1 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-200/50 dark:border-white/5">
            <tr>
              <th className="px-4 py-4 font-medium tracking-wider">Timestamp</th>
              <th className="px-4 py-4 font-medium tracking-wider">Status &amp; Mode</th>
              <th className="px-4 py-4 font-medium tracking-wider">Caller Details</th>
              <th className="px-4 py-4 font-medium tracking-wider">Metrics</th>
              <th className="px-4 py-4 font-medium tracking-wider">Sentiment</th>
              <th className="px-4 py-4 font-medium tracking-wider">Recording</th>
              <th className="px-4 py-4 font-medium tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 dark:divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400 dark:text-[#8b949e]">
                  <div className="flex flex-col items-center justify-center">
                    <Activity className="w-8 h-8 mb-3 text-gray-200 dark:text-[#30363d]" />
                    No calls logged yet. Complete a call to generate analytics.
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log: CallLog, idx: number) => {
                const isPositive = log.sentiment?.toLowerCase().includes("positive");
                const isNegative = log.sentiment?.toLowerCase().includes("negative");
                const callerNumber = getCallerNumber(log);
                const costDisplay = formatCostINR(log.cost);
                const hasRecording = !!(log.recording_path || log.sip_call_id);
                const uniqueKey = log.id ? `${log.id}-${idx}` : String(idx);
                const isExpanded = expandedRows.has(uniqueKey);
                
                const userName = log.user_info?.name || "Unknown Caller";

                return (
                  <React.Fragment key={uniqueKey}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors group ${isExpanded ? 'bg-gray-50 dark:bg-[#21262d]' : ''}`}>
                      <td suppressHydrationWarning className="px-4 py-4 whitespace-nowrap text-gray-800 dark:text-[#e6edf3]">
                        {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-[#2ea043]">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#2ea043]"></div>
                            {log.status || "Completed"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border inline-flex w-fit ${
                            log.direction === "inbound"
                              ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-[#2f81f7]/10 dark:text-[#2f81f7] dark:border-[#2f81f7]/20"
                              : "bg-purple-50 text-purple-600 border-purple-200 dark:bg-[#a371f7]/10 dark:text-[#a371f7] dark:border-[#a371f7]/20"
                          }`}>
                            {log.mode || "Voice Agent"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{userName}</span>
                          <span className="text-gray-500 dark:text-[#8b949e] text-xs mt-0.5">{callerNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-gray-500 dark:text-[#8b949e]">Dur: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{log.duration}s</span></span>
                          <span className="text-gray-500 dark:text-[#8b949e]">MOS: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{log.mos}</span></span>
                          <span className="text-gray-500 dark:text-[#8b949e]">Cost: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{costDisplay}</span></span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${
                          isPositive
                            ? "bg-green-50 text-green-600 border-green-200 dark:bg-[#2ea043]/10 dark:text-[#2ea043] dark:border-[#2ea043]/30"
                            : isNegative
                            ? "bg-red-50 text-red-600 border-red-200 dark:bg-[#da3633]/10 dark:text-[#da3633] dark:border-[#da3633]/30"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#8b949e]/10 dark:text-[#8b949e] dark:border-[#8b949e]/30"
                        }`}>
                          {log.sentiment || "Neutral"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {hasRecording ? (
                          <Link
                            href={`/logs/${log.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-[#2f81f7] bg-blue-50 dark:bg-[#2f81f7]/10 border border-blue-200 dark:border-[#2f81f7]/20 rounded-md hover:bg-blue-100 dark:hover:bg-[#2f81f7]/20 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {log.duration ? `${log.duration}s` : "Play"}
                          </Link>
                        ) : (
                          <span className="text-gray-300 dark:text-[#30363d] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/logs/${log.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#21262d] border border-gray-200 dark:border-white/10 rounded-md hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors shadow-sm"
                          >
                            View
                          </Link>
                          <button 
                            onClick={() => toggleRow(uniqueKey)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors shadow-sm ${
                              isExpanded 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-[#2f81f7]/10 dark:text-[#2f81f7] dark:border-[#2f81f7]/30' 
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#21262d] dark:text-gray-200 dark:border-white/10 dark:hover:bg-[#30363d]'
                            }`}
                            title="Expand extracted data"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Extracts
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50 dark:bg-[#21262d]/50 border-b border-gray-100 dark:border-white/5">
                        <td colSpan={7} className="px-8 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Left Col: Analysis & Summary */}
                            <div className="space-y-4">
                              {(() => {
                                const extractedData: Record<string, any> = { ...log.user_info };
                                
                                // Clean up repeated standard fields
                                const ignoreKeys = ['name', 'first_name', 'last_name', 'phone', 'email', 'phone_number'];
                                ignoreKeys.forEach(k => {
                                  if (extractedData[k]) delete extractedData[k];
                                });

                                if (log.caller_intent) extractedData["Caller Intent"] = log.caller_intent;
                                if (log.summary && log.summary !== "Summary generated locally or missing.") {
                                  extractedData["Call Summary"] = log.summary;
                                } else if (log.transcript && log.transcript.length > 0) {
                                  // Suggest that transcript exists but isn't analyzed yet
                                  extractedData["Call Summary"] = "Analysis pending (transcript available).";
                                }
                                
                                const hasExtractedData = Object.keys(extractedData).length > 0;

                                return hasExtractedData ? (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      Extracted Information
                                    </h4>
                                    <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200/50 dark:border-white/5 shadow-sm overflow-hidden">
                                      <table className="w-full text-left text-xs">
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                          {Object.entries(extractedData).map(([key, value]) => (
                                            <tr key={key} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                                              <th className="px-4 py-2.5 font-medium text-gray-500 dark:text-[#8b949e] capitalize w-1/3 bg-gray-50/50 dark:bg-white/[0.02]">
                                                {key.replace(/_/g, ' ')}
                                              </th>
                                              <td className="px-4 py-2.5 text-gray-900 dark:text-[#e6edf3] whitespace-pre-wrap break-words">
                                                {String(value || '-')}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      Extracted Information
                                    </h4>
                                    <div className="bg-white dark:bg-[#161b22] p-4 rounded-lg border border-gray-200/50 dark:border-white/5 shadow-sm flex flex-col items-center justify-center text-xs text-gray-500 dark:text-[#8b949e]">
                                      <span>No extracted information available for this call.</span>
                                      {log.transcript && <span className="mt-1">Click "View" to generate analysis dynamically.</span>}
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              <div className="pt-2">
                                <Link
                                  href={`/logs/${log.id}`}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-md hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors shadow-sm"
                                >
                                  <Play className="w-4 h-4" />
                                  Open Full Details Page
                                </Link>
                              </div>
                            </div>

                            {/* Right Col: Transcript */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-gray-500" />
                                Transcript Snapshot
                              </h4>
                              <div className="bg-white dark:bg-[#161b22] p-4 rounded-lg border border-gray-200/50 dark:border-white/5 shadow-sm max-h-[300px] overflow-y-auto">
                                {log.transcript ? (
                                  <div className="space-y-3">
                                    {log.transcript.split('\n').filter(Boolean).map((line: string, i: number) => {
                                      const isAgent = line.toLowerCase().startsWith('assistant:') || line.toLowerCase().startsWith('agent:');
                                      return (
                                        <div key={i} className={`text-sm ${isAgent ? 'text-blue-600 dark:text-[#2f81f7]' : 'text-gray-700 dark:text-[#e6edf3]'}`}>
                                          <span className="font-semibold text-xs opacity-70 block mb-0.5">
                                            {isAgent ? 'Agent' : 'User'}
                                          </span>
                                          {line.replace(/^(assistant|user|agent):\s*/i, '')}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No transcript available.</p>
                                )}
                              </div>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


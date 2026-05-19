import { getCallLogs } from "@/lib/actions";
import { Activity, Play, Volume2 } from "lucide-react";
import Link from "next/link";
import path from "path";

const AGENT_DID = "918065480288";

// VoBiz total_cost is already in INR — format directly, no conversion needed
function formatCostINR(cost: string | number | undefined): string {
  if (cost == null) return "₹0.00";
  const inr = typeof cost === "number" ? cost : (parseFloat(cost.replace(/[^0-9.-]/g, "")) || 0);
  return `₹${inr.toFixed(2)}`;
}

function getCallerNumber(log: any): string {
  if (log.caller_number) return log.caller_number;
  if (log.caller_id && log.caller_id.replace("+", "") !== AGENT_DID) return log.caller_id;
  if (log.phone_number && log.phone_number.replace("+", "") !== AGENT_DID) return log.phone_number;
  return log.phone_number || "Unknown";
}

export default async function LogsPage() {
  const logs = await getCallLogs();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-[#e6edf3]">Call Logs</h2>
        <p className="text-gray-500 dark:text-[#8b949e]">Transcripts, summaries, and sentiment analysis of all completed calls.</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-[#8b949e] uppercase bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d]">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status &amp; Mode</th>
                <th className="px-6 py-4 font-medium tracking-wider">Phone Number</th>
                <th className="px-6 py-4 font-medium tracking-wider">Metrics</th>
                <th className="px-6 py-4 font-medium tracking-wider">Sentiment</th>
                <th className="px-6 py-4 font-medium tracking-wider">Recording</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#30363d]">
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
                logs.map((log: any, idx: number) => {
                  const isPositive = log.sentiment?.toLowerCase().includes("positive");
                  const isNegative = log.sentiment?.toLowerCase().includes("negative");
                  const callerNumber = getCallerNumber(log);
                  const costDisplay = formatCostINR(log.cost);
                  const hasRecording = !!(log.recording_path || log.sip_call_id);

                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-[#e6edf3]">
                        {new Date(log.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-[#e6edf3]">
                        {callerNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-gray-500 dark:text-[#8b949e]">Dur: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{log.duration}s</span></span>
                          <span className="text-gray-500 dark:text-[#8b949e]">MOS: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{log.mos}</span></span>
                          <span className="text-gray-500 dark:text-[#8b949e]">Cost: <span className="text-gray-800 dark:text-[#e6edf3] font-medium">{costDisplay}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasRecording ? (
                          <Link
                            href={`/logs/${log.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-[#2f81f7] bg-blue-50 dark:bg-[#2f81f7]/10 border border-blue-200 dark:border-[#2f81f7]/20 rounded-md hover:bg-blue-100 dark:hover:bg-[#2f81f7]/20 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            {log.duration ? `${log.duration}s` : "Play"}
                          </Link>
                        ) : (
                          <span className="text-gray-300 dark:text-[#30363d] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/logs/${log.id}`}
                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-md hover:bg-gray-200 dark:hover:bg-[#30363d] transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

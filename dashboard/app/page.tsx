import { getOverviewStats } from "@/lib/actions";
import { Phone, CheckCircle, Hash, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import GlobeWrapper from "@/components/GlobeWrapper";
import CostGraph from "@/components/CostGraph";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function Overview() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen pb-10">
      {/* ROW 1: 6 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        
        {/* Calls Made */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">Calls Made</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCalls}</h3>
            </div>
            <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">Total Spend</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalCost)}</h3>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <span className="text-sm font-bold leading-none px-1">₹</span>
            </div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* Call Pickup Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">Call Pickup Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pickupRate}%</h3>
            </div>
            <div className="p-1.5 border border-green-200 text-green-600 rounded-full"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* SIP Trunk Calls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">SIP Trunk Calls</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.sipTrunkCalls}</h3>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-[10px] text-green-600 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
            </p>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href="/logs" className="text-[10px] text-blue-600 hover:underline flex items-center">View call logs <ChevronRight className="w-3 h-3" /></Link>
          </div>
        </div>

        {/* Voice API Calls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">Voice API Calls</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.voiceApiCalls}</h3>
            </div>
            <div className="p-1.5 bg-orange-50 text-orange-500 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-[10px] text-gray-500 font-medium flex items-center">
               -- No change <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
            </p>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href="/logs" className="text-[10px] text-blue-600 hover:underline flex items-center">View call logs <ChevronRight className="w-3 h-3" /></Link>
          </div>
        </div>

        {/* Active Numbers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800">Active Numbers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeNumbers}</h3>
            </div>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md"><Hash className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium flex items-center mt-3">
             -- No change <span className="text-gray-400 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

      </div>

      {/* ROW 2: Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Usage Overview</h3>
          <div className="h-[200px] w-full">
            <CostGraph logs={[]} customData={stats.usageChartData} type="usage" />
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Total Calls</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> SIP Trunk</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Voice API</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Cost Analysis</h3>
          <div className="h-[200px] w-full">
            <CostGraph logs={[]} customData={stats.costChartData} type="cost" />
          </div>
          <div className="flex items-center gap-3 mt-4 text-[10px] font-semibold text-gray-600 flex-wrap">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> CDR</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Recording</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Transcription</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Ncc</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400"></div> DID Purchase</span>
          </div>
        </div>
      </div>

      {/* ROW 3: Bar Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-800">Inbound & Outbound Calls</h3>
          <span className="text-[10px] text-gray-500">Activity by date</span>
        </div>
        <div className="h-[150px] w-full">
           <CostGraph logs={[]} customData={stats.inboundOutboundData} type="inboundOutbound" />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-500"></div> Inbound</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-orange-400"></div> Outbound</span>
        </div>
      </div>

      <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide mt-8 mb-2">Account & Infrastructure</h2>
      
      {/* ROW 4: Account & Infrastructure */}
      <div className="grid gap-4 md:grid-cols-1">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Global Call Distribution</h3>
          <div className="w-full h-[400px] flex items-center justify-center">
            <GlobeWrapper />
          </div>
        </div>
      </div>

    </div>
  );
}

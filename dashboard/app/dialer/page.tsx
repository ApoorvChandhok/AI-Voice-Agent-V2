"use client";

import { useState } from 'react';
import CallDispatcher from '@/components/CallDispatcher';
import BulkDialer from '@/components/BulkDialer';
import { PhoneOutgoing, Users } from 'lucide-react';

export default function DialerPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-[#e6edf3]">Outbound Campaigns</h2>
          <p className="text-gray-500 dark:text-[#8b949e]">Configure and deploy voice agents to your users.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#30363d] pb-px">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manual'
              ? "border-blue-500 dark:border-[#2f81f7] text-gray-900 dark:text-[#e6edf3]"
              : "border-transparent text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-[#e6edf3] hover:border-gray-300 dark:hover:border-[#8b949e]"
          }`}
        >
          <PhoneOutgoing className="w-4 h-4" />
          Single Dispatch
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bulk'
              ? "border-purple-500 dark:border-[#a371f7] text-gray-900 dark:text-[#e6edf3]"
              : "border-transparent text-gray-500 dark:text-[#8b949e] hover:text-gray-900 dark:hover:text-[#e6edf3] hover:border-gray-300 dark:hover:border-[#8b949e]"
          }`}
        >
          <Users className="w-4 h-4" />
          Bulk Campaign
        </button>
      </div>

      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Form */}
        <div className="flex-1 border-r border-gray-200 dark:border-[#30363d]">
          {activeTab === 'manual' ? <CallDispatcher /> : <BulkDialer />}
        </div>

        {/* Right Side: Information / Preview */}
        <div className="w-full md:w-[400px] bg-gray-50 dark:bg-[#0d1117]/50 p-8 hidden md:block">
          <div className="sticky top-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-[#e6edf3] uppercase tracking-wider mb-2">Campaign Settings</h3>
              <p className="text-sm text-gray-500 dark:text-[#8b949e] leading-relaxed">
                {activeTab === 'manual'
                  ? "Deploy a single voice agent immediately. Enter the recipient's phone number and provide specific context that the agent should know before dialing."
                  : "Upload a CSV file to deploy agents in bulk. The CSV must contain a 'phone' column. The agent will dial each number sequentially."}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-[#e6edf3] uppercase tracking-wider">Voice Capabilities</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-[#8b949e]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#2ea043]"></div>
                  Ultra-low latency inference
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#2ea043]"></div>
                  Background noise cancellation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#2ea043]"></div>
                  Sentiment analysis &amp; logging
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

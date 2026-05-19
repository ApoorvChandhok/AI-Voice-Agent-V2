"use client";

import { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';

export default function CallDispatcher() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const form = e.target as HTMLFormElement;
        const modelProvider = (form.elements.namedItem('modelProvider') as HTMLSelectElement).value;
        const voice = (form.elements.namedItem('voice') as HTMLSelectElement).value;

        try {
            const res = await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, prompt, modelProvider, voice }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(`Call dispatched to ${phoneNumber}`);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to dispatch call');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Network error');
        }
    };

    const inputClass = "w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#2f81f7] focus:border-blue-500 dark:focus:border-[#2f81f7] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#8b949e] outline-none transition-all text-sm";

    return (
        <div className="w-full">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-[#2f81f7]/10 text-blue-600 dark:text-[#2f81f7] rounded-lg">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e6edf3]">Manual Dial</h2>
                            <p className="text-sm text-gray-500 dark:text-[#8b949e]">Deploy an agent to a specific number</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleDispatch} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-[#e6edf3]">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+919876543210"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-[#e6edf3]">Context / Prompt</label>
                        <textarea
                            placeholder="e.g. You are calling regarding a coffee order..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className={`${inputClass} h-24 resize-none`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-[#e6edf3]">Model provider</label>
                            <select
                                className={inputClass}
                                name="modelProvider"
                                defaultValue="groq"
                            >
                                <option value="openai">OpenAI (GPT-4o)</option>
                                <option value="groq">Groq (Llama 3)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-[#e6edf3]">Voice</label>
                            <select
                                className={inputClass}
                                name="voice"
                                defaultValue="alloy"
                            >
                                <option value="alloy">Alloy (US)</option>
                                <option value="echo">Echo (US)</option>
                                <option value="shimmer">Shimmer (US)</option>
                                <option value="anushka">Anushka (IN)</option>
                                <option value="aravind">Aravind (IN)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-2.5 px-4 bg-blue-500 dark:bg-[#2f81f7] hover:bg-blue-600 dark:hover:bg-[#1a6de8] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                            </>
                        ) : (
                            'Initiate Call'
                        )}
                    </button>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${
                            status === 'success'
                                ? 'bg-green-50 dark:bg-[#2ea043]/10 text-green-700 dark:text-[#2ea043] border-green-200 dark:border-[#2ea043]/20'
                                : 'bg-red-50 dark:bg-[#da3633]/10 text-red-700 dark:text-[#da3633] border-red-200 dark:border-[#da3633]/20'
                        }`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

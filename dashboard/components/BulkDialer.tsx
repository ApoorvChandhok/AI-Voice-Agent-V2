"use client";

import { useState, useEffect } from 'react';
import { Users, Upload, Play, Loader2, Server } from 'lucide-react';

export default function BulkDialer() {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'dialing' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState({ total: 0, current: 0 });
    const [message, setMessage] = useState('');
    
    // Add state for dynamic defaults
    const [defaultModel, setDefaultModel] = useState('groq');
    const [defaultVoice, setDefaultVoice] = useState('alloy');
    
    // Fetch defaults from config
    useEffect(() => {
        fetch('/api/agent-config?mode=outbound')
            .then(res => res.json())
            .then(data => {
                if (data?.config) {
                    if (data.config.llm_provider) setDefaultModel(data.config.llm_provider);
                    if (data.config.tts_voice) setDefaultVoice(data.config.tts_voice);
                }
            })
            .catch(console.error);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleBulkDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setStatus('error');
            setMessage('Please upload a CSV file with a "phone" column.');
            return;
        }

        setStatus('processing');
        setMessage('Processing CSV file...');

        const text = await file.text();
        const lines = text.split('\n');
        
        let headerLine = lines[0].toLowerCase();
        let phoneIndex = headerLine.split(',').findIndex(col => col.trim().includes('phone'));

        if (phoneIndex === -1) {
            setStatus('error');
            setMessage('CSV must contain a column named "phone".');
            return;
        }

        const numbers = lines.slice(1)
            .map(line => line.split(',')[phoneIndex]?.trim())
            .filter(num => num && num.length >= 10);

        if (numbers.length === 0) {
            setStatus('error');
            setMessage('No valid phone numbers found in CSV.');
            return;
        }

        setStatus('dialing');
        setProgress({ total: numbers.length, current: 0 });

        const form = e.target as HTMLFormElement;
        const modelProvider = (form.elements.namedItem('modelProvider') as HTMLSelectElement).value;
        const voice = (form.elements.namedItem('voice') as HTMLSelectElement).value;

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            try {
                const res = await fetch('/api/dispatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: num, prompt, modelProvider, voice }),
                });

                if (res.ok) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setStatus('completed');
        setMessage(`Campaign finished. Success: ${successCount}, Failed: ${failCount}`);
    };

    return (
        <div className="w-full">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#a371f7]/10 text-[#a371f7] rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#e6edf3]">Bulk Campaign</h2>
                            <p className="text-sm text-[#8b949e]">Upload CSV to dial multiple users</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleBulkDispatch} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3]">Upload CSV Leads</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#30363d] rounded-lg cursor-pointer bg-[#0d1117] hover:bg-[#21262d] hover:border-[#8b949e] transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 mb-2 text-[#8b949e]" />
                                    <p className="text-xs text-[#8b949e]">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-[10px] text-[#8b949e] mt-1">Must contain 'phone' column</p>
                                </div>
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        {file && <p className="text-xs text-[#2ea043] mt-2">Selected: {file.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3]">Campaign Prompt / Context</label>
                        <textarea
                            placeholder="Provide universal instructions for the agent..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-[#e6edf3] placeholder-[#8b949e] outline-none transition-all h-20 resize-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#e6edf3]">Model provider</label>
                            <select
                                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] outline-none focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-sm"
                                name="modelProvider"
                                value={defaultModel}
                                onChange={(e) => setDefaultModel(e.target.value)}
                            >
                                <option value="openai">OpenAI (GPT-4o)</option>
                                <option value="groq">Groq (Llama 3)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#e6edf3]">Voice</label>
                            <select
                                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] outline-none focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-sm"
                                name="voice"
                                value={defaultVoice}
                                onChange={(e) => setDefaultVoice(e.target.value)}
                            >
                                <option value="alloy">Alloy (US)</option>
                                <option value="echo">Echo (US)</option>
                                <option value="shimmer">Shimmer (US)</option>
                                <option value="anushka">Anushka (IN)</option>
                                <option value="aravind">Aravind (IN)</option>
                                <option value="f786b574-daa5-4673-aa0c-cbe3e8534c02">Default Voice (Cartesia)</option>
                                <option value="aura-asteria-en">Asteria (Deepgram)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={['processing', 'dialing'].includes(status) || !file}
                        className="w-full py-2.5 px-4 bg-[#a371f7] hover:bg-[#8957e5] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {['processing', 'dialing'].includes(status) ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Dialing {progress.current} / {progress.total}
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" /> Start Campaign
                            </>
                        )}
                    </button>

                    {status === 'dialing' && (
                        <div className="w-full bg-[#0d1117] rounded-full h-1.5 border border-[#30363d]">
                            <div className="bg-[#a371f7] h-1.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${status === 'completed' ? 'bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/20' : status === 'error' ? 'bg-[#da3633]/10 text-[#da3633] border-[#da3633]/20' : 'bg-[#2f81f7]/10 text-[#2f81f7] border-[#2f81f7]/20'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

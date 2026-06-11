const fs = require('fs');
const file = 'components/workflows/WorkflowNodeConfigPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add DragCtx and helpers
const importsInsertIndex = code.indexOf('interface Props {');
const ctxCode = `
export const DragCtx = React.createContext<{
  draggedPath: string | null;
  setDraggedPath: (val: string | null) => void;
}>({ draggedPath: null, setDraggedPath: () => {} });

function insertAtCaret(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const val = input.value;
  return val.slice(0, start) + text + val.slice(end);
}

`;
code = code.substring(0, importsInsertIndex) + ctxCode + code.substring(importsInsertIndex);

// 2. Replace InputField and TextAreaField with drag-aware versions
const sharedFormsStart = code.indexOf('function InputField({');
const sharedFormsEnd = code.indexOf('function SelectField({');

const newFields = `
function InputField({
  label, value, onChange, placeholder, type = "text", helperText, monospace,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; helperText?: string; monospace?: boolean;
}) {
  const { draggedPath } = React.useContext(DragCtx);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">{label}</label>
      <input
        ref={inputRef}
        type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (draggedPath && inputRef.current) {
            const newVal = insertAtCaret(inputRef.current, "{{" + draggedPath + "}}");
            onChange(newVal);
          }
        }}
        className={\`w-full px-3 py-2 text-sm rounded-lg border transition-all
          \${isDragOver ? "border-green-500 ring-2 ring-green-500/30 bg-green-500/5 dark:bg-green-500/10" : "border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117]"}
          text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58]
          focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]
          \${monospace ? "font-mono text-xs" : ""}\`}
      />
      {helperText && <p className="text-[10px] text-gray-400 dark:text-[#6e7681]">{helperText}</p>}
    </div>
  );
}

function TextAreaField({
  label, value, onChange, placeholder, rows = 4, monospace,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; monospace?: boolean;
}) {
  const { draggedPath } = React.useContext(DragCtx);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">{label}</label>
      <textarea
        ref={inputRef}
        value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (draggedPath && inputRef.current) {
            const newVal = insertAtCaret(inputRef.current, "{{" + draggedPath + "}}");
            onChange(newVal);
          }
        }}
        className={\`w-full px-3 py-2 text-sm rounded-lg border transition-all resize-none
          \${isDragOver ? "border-green-500 ring-2 ring-green-500/30 bg-green-500/5 dark:bg-green-500/10" : "border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117]"}
          text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58]
          focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]
          \${monospace ? "font-mono text-xs leading-relaxed" : ""}\`}
      />
    </div>
  );
}

`;
code = code.substring(0, sharedFormsStart) + newFields + code.substring(sharedFormsEnd);

// 3. Add SchemaView and DataViewTabs
const componentStart = code.indexOf('export function WorkflowNodeConfigPanel(');

const dataViews = `
function SchemaView({ data, path = "$json" }: { data: any; path?: string }) {
  const { setDraggedPath } = React.useContext(DragCtx);
  
  if (data === null || data === undefined) return <span className="text-gray-500 italic">null</span>;
  if (typeof data !== "object") {
    return <span className="text-[#2f81f7]">{String(data)}</span>;
  }

  return (
    <div className="pl-4 border-l border-gray-200 dark:border-[#30363d] ml-2 space-y-1 mt-1">
      {Object.entries(data).map(([key, val]) => {
        const fullPath = Array.isArray(data) ? \`\${path}[\${key}]\` : \`\${path}.\${key}\`;
        const isPrimitive = val === null || typeof val !== "object";
        
        return (
          <div key={key} className="text-xs font-mono">
            <div 
              draggable={isPrimitive}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", \`{{\${fullPath}}}\`);
                setDraggedPath(fullPath);
              }}
              onDragEnd={() => setDraggedPath(null)}
              className={\`flex items-start gap-1 py-0.5 \${isPrimitive ? "cursor-grab active:cursor-grabbing hover:bg-[#2f81f7]/10 rounded px-1 -ml-1 transition-colors group" : ""}\`}
            >
              <span className="text-gray-600 dark:text-[#e6edf3] font-semibold">{key}:</span>
              {isPrimitive ? (
                <span className="text-[#2f81f7] truncate group-hover:text-[#458df8]">{String(val)}</span>
              ) : (
                <div className="w-full">
                  <span className="text-gray-400">{Array.isArray(val) ? "Array" : "Object"}</span>
                  <SchemaView data={val} path={fullPath} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataViewTabs({ data, defaultMsg }: { data: any; defaultMsg: string }) {
  const [view, setView] = React.useState<"schema"|"table"|"json">("schema");
  
  return (
    <div className="flex flex-col h-full bg-[#161b22]">
      <div className="flex items-center gap-1 p-2 border-b border-[#30363d]">
        <button onClick={() => setView("schema")} className={\`px-3 py-1 rounded text-[10px] font-semibold transition-colors \${view === "schema" ? "bg-[#30363d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}\`}>Schema</button>
        <button onClick={() => setView("table")} className={\`px-3 py-1 rounded text-[10px] font-semibold transition-colors \${view === "table" ? "bg-[#30363d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}\`}>Table</button>
        <button onClick={() => setView("json")} className={\`px-3 py-1 rounded text-[10px] font-semibold transition-colors \${view === "json" ? "bg-[#30363d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}\`}>JSON</button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {!data ? (
          <div className="text-xs text-[#8b949e] font-mono whitespace-pre-wrap">{defaultMsg}</div>
        ) : view === "json" ? (
          <pre className="text-[10px] font-mono text-[#c9d1d9] leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : view === "table" ? (
          <div className="text-xs text-[#8b949e]">Table view placeholder</div>
        ) : (
          <div className="text-[#c9d1d9]">
            <span className="text-xs font-mono font-semibold text-[#e6edf3]">Root</span>
            <SchemaView data={data} path="$json" />
          </div>
        )}
      </div>
    </div>
  );
}

`;
code = code.substring(0, componentStart) + dataViews + code.substring(componentStart);

// 4. Inject DragCtx State into WorkflowNodeConfigPanel
code = code.replace(
  'const [copiedJson, setCopiedJson] = useState(false);',
  'const [copiedJson, setCopiedJson] = useState(false);\n  const [draggedPath, setDraggedPath] = useState<string | null>(null);'
);

// 5. Replace main return block with the 3-column modal layout
const returnRegex = /return \(\s*<div className="w-\[400px\][\s\S]*$/;
const newReturn = `return (
    <DragCtx.Provider value={{ draggedPath, setDraggedPath }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div 
          onClick={e => e.stopPropagation()}
          className="w-full max-w-7xl h-[90vh] bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Header */}
          <div className="p-3 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between bg-white dark:bg-[#161b22] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">{node.label}</div>
              <div className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#30363d] text-[#8b949e]">
                {node.type.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border border-[#30363d] overflow-hidden">
                <button className="px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center gap-1 border-r border-[#30363d]">
                  <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Prev
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center gap-1">
                  Next <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>
              <div className="w-px h-4 bg-[#30363d] mx-1" />
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Back to Canvas
              </button>
            </div>
          </div>

          {/* Three Columns Grid */}
          <div className="flex-1 flex min-h-0">
            
            {/* LEFT COLUMN: INPUT */}
            <div className="w-[30%] flex flex-col border-r border-[#30363d] bg-[#0d1117]">
              <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2f81f7]" />
                  <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Input</span>
                </div>
                <button onClick={() => copyJson(executionData?.input)} className="text-[10px] text-[#8b949e] hover:text-[#e6edf3] flex items-center gap-1 bg-[#21262d] px-2 py-1 rounded border border-[#30363d] transition-colors">
                  {copiedJson ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <DataViewTabs data={executionData?.input || { "node_1780332c61d1_ol5stq": { "note": "No data yet. Run workflow to see output." } }} defaultMsg="No data yet. Run workflow to see output." />
              </div>
              <div className="h-40 border-t border-[#30363d] bg-[#161b22] flex flex-col p-3">
                <div className="text-[10px] font-bold text-[#2f81f7] uppercase mb-3 flex items-center gap-1.5">
                  ? Previous Nodes
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] group cursor-pointer hover:border-gray-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-[#e6edf3]">New Lead Captured</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE COLUMN: PARAMETERS & SETTINGS */}
            <div className="w-[40%] flex flex-col border-r border-[#30363d] bg-[#0d1117]">
              {/* Tab Bar */}
              <div className="flex border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
                {(["config", "settings"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={\`flex-1 py-3 text-[11px] font-bold text-center transition-all capitalize relative \${
                      activeTab === tab
                        ? "text-[#e6edf3]"
                        : "text-[#8b949e] hover:text-[#c9d1d9]"
                    }\`}
                  >
                    {tab === "config" ? "Parameters" : "Settings"}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f81f7]" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {activeTab === "settings" ? (
                  renderSettingsTab()
                ) : (
                  <>
                    <InputField label="Node Label" value={node.label} onChange={updateLabel} placeholder="Enter a custom label..." />
                    
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Configuration</h4>
                      {renderConfigFields()}
                    </div>

                    <div className="pt-4 border-t border-[#30363d]">
                      <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <PinOff className="w-3.5 h-3.5" /> Data Pinning
                      </h4>
                      <p className="text-[10px] text-[#8b949e]">
                        Run the workflow once to pin output data for repeatable testing.
                      </p>
                      <div className="mt-3">
                        <DataPinningSection
                          pinnedData={node.config._pinnedData}
                          onPin={pinData}
                          onUnpin={unpinData}
                          executionData={executionData}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: OUTPUT */}
            <div className="w-[30%] flex flex-col bg-[#0d1117]">
              <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Output</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {!executionData?.output ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8b949e] p-6 text-center space-y-2">
                    <p className="text-xs">No output data available.</p>
                    <p className="text-[10px]">Run the workflow or pin data.</p>
                  </div>
                ) : (
                  <DataViewTabs data={executionData.output} defaultMsg="No data yet." />
                )}
              </div>
              <div className="h-40 border-t border-[#30363d] bg-[#161b22] flex flex-col p-3">
                <div className="text-[10px] font-bold text-[#2f81f7] uppercase mb-3 flex items-center gap-1.5">
                  ? Next Nodes
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] group cursor-pointer hover:border-gray-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-[#e6edf3]">Request Phone Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">No</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] group cursor-pointer hover:border-gray-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#2f81f7]" />
                      <span className="text-xs font-medium text-[#e6edf3]">AI Discovery Call</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">Yes</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DragCtx.Provider>
  );
}
`;
code = code.replace(returnRegex, newReturn);

fs.writeFileSync(file, code);
console.log('Success!');

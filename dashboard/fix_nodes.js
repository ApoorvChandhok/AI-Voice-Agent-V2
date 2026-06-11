const fs = require('fs');
const file = 'components/workflows/WorkflowNodeConfigPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update Props
code = code.replace(
  'interface Props {\n  node: WorkflowNode | null;\n  onClose: () => void;\n  onUpdate: (id: string, config: Record<string, any>, label?: string) => void;\n  executionData?: any;\n}',
  `interface Props {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (id: string, config: Record<string, any>, label?: string) => void;
  executionData?: any;
  nodes?: WorkflowNode[];
  edges?: any[];
  selectedExecution?: any;
  onSelectNode?: (id: string) => void;
}`
);

// 2. Update Component Signature
code = code.replace(
  'export default function WorkflowNodeConfigPanel({ node, onClose, onUpdate, executionData }: Props) {',
  'export default function WorkflowNodeConfigPanel({ node, onClose, onUpdate, executionData, nodes, edges, selectedExecution, onSelectNode }: Props) {'
);

// 3. Insert computed nodes before return
const returnMatch = code.match(/return \(\s*<DragCtx\.Provider/);
if (returnMatch) {
  const insertCode = `
  const prevEdges = edges?.filter(e => e.target === node?.id) || [];
  const prevNodes = prevEdges.map(e => ({
    node: nodes?.find(n => n.id === e.source),
    edge: e
  })).filter(n => n.node) as { node: WorkflowNode, edge: any }[];

  const nextEdges = edges?.filter(e => e.source === node?.id) || [];
  const nextNodes = nextEdges.map(e => ({
    node: nodes?.find(n => n.id === e.target),
    edge: e
  })).filter(n => n.node) as { node: WorkflowNode, edge: any }[];

  `;
  code = code.replace(returnMatch[0], insertCode + returnMatch[0]);
}

// 4. Replace Previous Nodes section
const prevNodesRegex = /<\div className="text-\[10px\] font-bold text-\[\#2f81f7\] uppercase mb-3 flex items-center gap-1\.5">\s*\? Previous Nodes\s*<\/div>\s*<div className="flex-1 overflow-y-auto space-y-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newPrevNodes = `<div className="text-[10px] font-bold text-[#2f81f7] uppercase mb-3 flex items-center gap-1.5">
                  ? Previous Nodes
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {prevNodes.length === 0 ? (
                    <div className="text-xs text-[#8b949e] italic text-center py-4">No previous nodes</div>
                  ) : (
                    prevNodes.map(({ node: pNode, edge }) => (
                      <div 
                        key={pNode.id}
                        onClick={() => onSelectNode?.(pNode.id)}
                        className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] group cursor-pointer hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeMetadata(pNode.type).color }} />
                          <span className="text-xs font-medium text-[#e6edf3]">{pNode.label}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>`;
code = code.replace(prevNodesRegex, newPrevNodes);

// 5. Replace Next Nodes section
const nextNodesRegex = /<\div className="text-\[10px\] font-bold text-\[\#2f81f7\] uppercase mb-3 flex items-center gap-1\.5">\s*\? Next Nodes\s*<\/div>\s*<div className="flex-1 overflow-y-auto space-y-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newNextNodes = `<div className="text-[10px] font-bold text-[#2f81f7] uppercase mb-3 flex items-center gap-1.5">
                  ? Next Nodes
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {nextNodes.length === 0 ? (
                    <div className="text-xs text-[#8b949e] italic text-center py-4">No next nodes</div>
                  ) : (
                    nextNodes.map(({ node: nNode, edge }) => {
                      const conditionLabel = edge.sourceHandle?.includes('yes') ? 'Yes' : edge.sourceHandle?.includes('no') ? 'No' : null;
                      return (
                        <div 
                          key={nNode.id}
                          onClick={() => onSelectNode?.(nNode.id)}
                          className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] group cursor-pointer hover:border-gray-500 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeMetadata(nNode.type).color }} />
                            <span className="text-xs font-medium text-[#e6edf3]">{nNode.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {conditionLabel && (
                              <span className={\`text-[9px] font-bold px-1.5 py-0.5 rounded border \${conditionLabel === 'Yes' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}\`}>
                                {conditionLabel}
                              </span>
                            )}
                            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>`;
code = code.replace(nextNodesRegex, newNextNodes);

fs.writeFileSync(file, code);
console.log('Done!');

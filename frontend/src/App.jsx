import React, { useState } from 'react';

// Recursive component to display tree levels visually with indentations
function VisualTree({ node, children }) {
  const childKeys = Object.keys(children);
  return (
    <div className="mt-1.5 ml-5 border-l border-dashed border-gray-300 pl-3">
      <div className="flex items-center gap-2 py-0.5">
        <span className="text-gray-400 text-sm">{childKeys.length > 0 ? '📁' : '📄'}</span>
        <span className="font-semibold text-gray-700 text-sm">{node}</span>
      </div>
      {childKeys.map(child => (
        <VisualTree key={child} node={child} children={children[child]} />
      ))}
    </div>
  );
}

function App() {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleData = {
    data: [
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->"
    ]
  };

  const loadExample = () => {
    setInputText(JSON.stringify(sampleData, null, 2));
    setValidationError(null);
    setError(null);
  };

  const handleCopyJson = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseInput = (rawStr) => {
    const trimmed = rawStr.trim();
    if (!trimmed) {
      throw new Error('Input is empty. Please enter relationship data.');
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.data)) {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        return { data: parsed };
      }
      throw new Error("JSON payload must contain a 'data' array. E.g. { \"data\": [...] }");
    } catch (err) {
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }
      
      // Fallback: split by line or comma
      const lines = trimmed
        .split(/[\n,]+/)
        .map(el => el.trim())
        .filter(el => el.length > 0);
      
      if (lines.length > 0) {
        return { data: lines };
      }
      throw new Error('Unable to parse input text into an edge list.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    setError(null);

    let parsedPayload;
    try {
      parsedPayload = parseInput(inputText);
    } catch (err) {
      setValidationError(err.message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedPayload),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || 'Could not connect to the API server.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">🌿</span> Graph Hierarchy Parser
            </h1>
            <p className="text-xs text-gray-500">Chitkara Full Stack Challenge</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Candidate</div>
              <div className="text-sm font-semibold text-gray-700">Sahil Rawat</div>
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Roll Number</div>
              <div className="text-sm font-semibold text-gray-700">2310992137</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Input Card */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Input Edges</h2>
            <button
              onClick={loadExample}
              type="button"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2.5 py-1.5 transition-colors"
            >
              Load Example Data
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Provide relationship connections in a standard format (e.g. <code>A-&gt;B</code>). Supports raw JSON array or simple comma-separated lists.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`{
  "data": ["A->B", "A->C", "B->D"]
}`}
                className="w-full h-36 font-mono text-sm border border-gray-300 rounded p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
              />
              {validationError && (
                <div className="text-red-600 text-xs mt-1.5 font-medium">
                  ⚠️ {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-2.5 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Submit Query</span>
              )}
            </button>
          </form>
        </section>

        {/* Connection Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-bold text-sm">Server Request Failed</h4>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Output Area */}
        {response && (
          <div className="space-y-6">
            
            {/* Summary Counters */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valid Trees</div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{response.summary.total_trees}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cyclic Groups</div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{response.summary.total_cycles}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Largest Tree Root</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-1">{response.summary.largest_tree_root || 'None'}</div>
              </div>
            </section>

            {/* Structured Hierarchies and Statistics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Visual Graph Trees */}
              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                  Structured Component Hierarchies
                </h3>
                
                {response.hierarchies.length === 0 ? (
                  <div className="text-gray-400 text-xs italic py-4">No tree components discovered.</div>
                ) : (
                  <div className="space-y-4">
                    {response.hierarchies.map((h, i) => (
                      <div key={i} className="border border-gray-200 rounded-md p-4 bg-gray-50/50">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                          <span className="text-sm font-bold text-gray-800">
                            Component {i + 1}: Root <span className="text-blue-600 font-extrabold">{h.root}</span>
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${h.has_cycle ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                            {h.has_cycle ? 'Cycle' : `Tree (Depth ${h.depth})`}
                          </span>
                        </div>

                        {h.has_cycle ? (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-xs">
                            <span className="text-sm">🔄</span>
                            <div>
                              <strong>Circular dependency detected!</strong> This connected component contains closed loops. Hierarchy details are omitted.
                            </div>
                          </div>
                        ) : (
                          <div className="py-1">
                            {Object.keys(h.tree).map(rootKey => (
                              <div key={rootKey}>
                                <div className="flex items-center gap-2 py-0.5">
                                  <span className="text-blue-600 text-sm">🌳</span>
                                  <span className="font-bold text-gray-800 text-sm">{rootKey}</span>
                                </div>
                                {Object.keys(h.tree[rootKey]).map(childKey => (
                                  <VisualTree key={childKey} node={childKey} children={h.tree[rootKey][childKey]} />
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Right Column: Validation insights + JSON */}
              <div className="space-y-6">
                
                {/* Warnings / Insights Panel */}
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parsing Insights</h3>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Invalid Entries ({response.invalid_entries.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {response.invalid_entries.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">None</span>
                      ) : (
                        response.invalid_entries.map((entry, idx) => (
                          <span key={idx} className="bg-red-50 border border-red-200 text-red-700 text-xs rounded px-2 py-0.5 font-mono">
                            {entry}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Duplicate Edges ({response.duplicate_edges.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {response.duplicate_edges.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">None</span>
                      ) : (
                        response.duplicate_edges.map((edge, idx) => (
                          <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded px-2 py-0.5 font-mono">
                            {edge}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Raw API JSON Panel */}
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Raw API Response</h3>
                    <button
                      onClick={handleCopyJson}
                      type="button"
                      className="text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded px-2 py-1 transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 rounded p-4 overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-80">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                </section>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <div>
            API Hosted Endpoint: <code className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded">/bfhl</code>
          </div>
          <div>
            College Email: <a href={`mailto:${response?.email_id || 'sahil2137.be23@chitkara.edu.in'}`} className="hover:text-blue-500 underline">{response?.email_id || 'sahil2137.be23@chitkara.edu.in'}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

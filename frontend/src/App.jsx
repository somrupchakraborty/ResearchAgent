import React, { useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import axios from 'axios';
import UploadZone from './components/UploadZone';
import ResearchView from './components/ResearchView';

function App() {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchData, setResearchData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setIsGenerating(true);
    setResearchData(null);

    try {
      const response = await axios.post('http://localhost:8000/generate', {
        query: query,
        focus_domains: ["mckinsey.com", "bcg.com", "bain.com", "gartner.com", "arxiv.org"]
      });

      setResearchData(response.data);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate research. Make sure backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">DeepResearch Agent</h1>
          </div>
          <div className="text-sm text-slate-500">
            Local RAG + Web Search
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Generate Enterprise-Grade Research
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your internal documents and let our agent synthesize them with insights from Fortune 500s, McKinsey, BCG, and more.
          </p>
        </div>

        {/* Upload Section */}
        <UploadZone onUploadComplete={setUploadedFile} />

        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-accent transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              placeholder="What would you like to research? (e.g., 'Impact of AI on Supply Chain')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={!query.trim() || isGenerating}
              className="absolute right-2 top-2 bottom-2 px-6 bg-accent text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? 'Thinking...' : 'Generate'}
            </button>
          </div>
          <p className="mt-3 text-xs text-center text-slate-400">
            Sources: Internal Docs + McKinsey, BCG, Bain, Gartner, Arxiv, FAANG
          </p>
        </div>

        {/* Results View */}
        <ResearchView researchData={researchData} isLoading={isGenerating} />
      </main>
    </div>
  );
}

export default App;

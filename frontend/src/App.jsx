import React, { useState } from 'react';
import ThemeManager from './components/ThemeManager';
import ResearchDashboard from './components/ResearchDashboard';
import { Sprout, Target } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('seeder');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <span className="text-xl font-bold text-gray-900">Research Agent</span>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('seeder')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'seeder' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Sprout className="w-4 h-4" /> Upload docs
            </button>
            <button
              onClick={() => setActiveTab('hunter')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'hunter' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Target className="w-4 h-4" /> The Hunter
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">
        {activeTab === 'seeder' ? <ThemeManager /> : <ResearchDashboard />}
      </main>
    </div>
  );
}

export default App;

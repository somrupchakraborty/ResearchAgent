import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, FileText, ExternalLink, Youtube, BookOpen, BarChart2, MessageCircle, Briefcase } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const ResearchDashboard = () => {
    const [themes, setThemes] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchThemes();
        fetchHistory();
    }, []);

    const fetchThemes = async () => {
        try {
            const res = await axios.get(`${API_URL}/themes`);
            setThemes(res.data.filter(t => t.status === 'active'));
        } catch (error) {
            console.error("Error fetching themes:", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/research/history`);
            setHistory(res.data.reverse()); // Newest first
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const runResearch = async (theme) => {
        setLoading(true);
        setResearchData(null);
        try {
            const res = await axios.post(`${API_URL}/research/run`, { theme_id: theme.id });
            setResearchData(res.data);
            fetchHistory(); // Update history list
        } catch (error) {
            console.error("Error running research:", error);
            alert("Research run failed.");
        } finally {
            setLoading(false);
        }
    };

    const loadRun = (run) => {
        setResearchData(run);
        const theme = themes.find(t => t.id === run.theme_id);
        if (theme) setSelectedTheme(theme);
    };

    const [deepDiveSummary, setDeepDiveSummary] = useState(null);
    const [diving, setDiving] = useState(false);

    const handleDeepDive = async (url) => {
        setDiving(true);
        setDeepDiveSummary(null);
        try {
            const res = await axios.post(`${API_URL}/research/deep-dive`, { url });
            setDeepDiveSummary(res.data.summary);
        } catch (error) {
            console.error("Error performing deep dive:", error);
            alert("Failed to generate deep dive summary.");
        } finally {
            setDiving(false);
        }
    };

    const buckets = [
        { id: 'mbb', name: 'MBB Consulting', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'market', name: 'Market Research', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'reddit', name: 'Community (Reddit)', icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'arxiv', name: 'Academic (Arxiv)', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'youtube', name: 'Media (YouTube)', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 relative">
            {/* Deep Dive Modal */}
            {(diving || deepDiveSummary) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Deep Dive Summary
                            </h3>
                            <button
                                onClick={() => { setDeepDiveSummary(null); setDiving(false); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto prose prose-blue max-w-none">
                            {diving ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-gray-500">Reading content and generating summary...</p>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {deepDiveSummary}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => { setDeepDiveSummary(null); setDiving(false); }}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">The Hunter</h1>
                    <p className="text-gray-500">Deep dive research across multiple sources.</p>
                </div>
            </div>

            {/* Theme Selection & History */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <h2 className="font-semibold text-gray-700 mb-3">Active Themes</h2>
                        <div className="space-y-2">
                            {themes.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No active themes. Go to Seeder to activate one.</p>
                            ) : (
                                themes.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => { setSelectedTheme(theme); setResearchData(null); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTheme?.id === theme.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        {theme.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <h2 className="font-semibold text-gray-700 mb-3">Recent Runs</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {history.map(run => (
                                <button
                                    key={run.id}
                                    onClick={() => loadRun(run)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 text-gray-600 truncate"
                                >
                                    <div className="font-medium text-gray-800 truncate">{run.theme_name}</div>
                                    <div className="text-gray-400">{new Date(run.timestamp).toLocaleDateString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {!selectedTheme ? (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Select an active theme to start research.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Action Bar */}
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedTheme.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedTheme.description}</p>
                                </div>
                                <button
                                    onClick={() => runResearch(selectedTheme)}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                                    {loading ? "Hunting..." : "Run Research Now"}
                                </button>
                            </div>

                            {/* Results Grid */}
                            {researchData && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
                                    {buckets.map(bucket => {
                                        const data = researchData.buckets[bucket.id];
                                        const Icon = bucket.icon;
                                        return (
                                            <div key={bucket.id} className="min-w-[280px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                                                {/* Bucket Header */}
                                                <div className={`p-4 border-b border-gray-100 ${bucket.bg}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon className={`w-5 h-5 ${bucket.color}`} />
                                                        <h3 className={`font-bold ${bucket.color}`}>{bucket.name}</h3>
                                                    </div>
                                                    {data && (
                                                        <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-100/50 italic">
                                                            "{data.summary}"
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Results List */}
                                                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                                                    {data?.results.length === 0 ? (
                                                        <p className="text-xs text-gray-400 text-center py-4">No results found.</p>
                                                    ) : (
                                                        data?.results.map((result, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-100 transition-all group cursor-pointer"
                                                            >
                                                                <h4
                                                                    onClick={() => handleDeepDive(result.href)}
                                                                    className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 line-clamp-2 mb-1 hover:underline"
                                                                >
                                                                    {result.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 line-clamp-3 mb-2">
                                                                    {result.body}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                                    <a
                                                                        href={result.href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 hover:text-blue-600"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        <span className="truncate max-w-[100px]">{new URL(result.href).hostname}</span>
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeepDive(result.href)}
                                                                        className="flex items-center gap-1 hover:text-blue-600 ml-auto"
                                                                    >
                                                                        <FileText className="w-3 h-3" /> Summary
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResearchDashboard;

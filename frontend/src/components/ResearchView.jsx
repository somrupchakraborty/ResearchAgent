import React from 'react';
import { FileText, ExternalLink, BookOpen, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ResearchView = ({ researchData, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-8 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                    <div className="space-y-3 mt-8">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                </div>
                <p className="mt-4 text-slate-500">Synthesizing research from local docs and web sources...</p>
            </div>
        );
    }

    if (!researchData) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Article Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-semibold text-slate-800">Generated Research Article</h2>
                </div>
                <div className="p-8 prose prose-slate max-w-none">
                    <ReactMarkdown>{researchData.article}</ReactMarkdown>
                </div>
            </div>

            {/* Sources Section */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Local Sources */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-medium">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <h3>Local Context Used</h3>
                    </div>
                    <div className="space-y-3">
                        {researchData.sources.local.map((source, idx) => (
                            <div key={idx} className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                                <p className="line-clamp-3 italic">"{source.substring(0, 150)}..."</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Web Sources */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-medium">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <h3>Web References</h3>
                    </div>
                    <div className="space-y-3">
                        {researchData.sources.web.map((source, idx) => (
                            <a
                                key={idx}
                                href={source.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="text-sm bg-slate-50 p-3 rounded border border-slate-100 group-hover:border-accent/30 group-hover:bg-accent/5 transition-colors">
                                    <div className="font-medium text-slate-900 flex items-center justify-between">
                                        {source.title}
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{source.body}</p>
                                    <p className="text-xs text-accent mt-2 truncate">{source.href}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchView;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Plus, Trash2, Edit2, Check, Play, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const ThemeManager = () => {
    const [themes, setThemes] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [editingTheme, setEditingTheme] = useState(null);

    const [creating, setCreating] = useState(false);
    const [newTheme, setNewTheme] = useState({ name: '', description: '', keywords: '', schedule: 'weekly' });

    useEffect(() => {
        fetchThemes();
    }, []);

    const fetchThemes = async () => {
        try {
            const res = await axios.get(`${API_URL}/themes`);
            setThemes(res.data);
        } catch (error) {
            console.error("Error fetching themes:", error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/upload`, formData);
            // Refresh themes after extraction
            fetchThemes();
        } catch (error) {
            console.error("Error uploading file:", error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Failed to extract themes: ${error.response.data.detail}`);
            } else {
                alert("Failed to extract themes.");
            }
        } finally {
            setUploading(false);
            event.target.value = null; // Reset input to allow selecting same file again
        }
    };

    const handleCreateTheme = async () => {
        if (!newTheme.name || !newTheme.description) {
            alert("Please fill in name and description.");
            return;
        }

        try {
            await axios.post(`${API_URL}/themes/create`, {
                ...newTheme,
                keywords: newTheme.keywords.split(",").map(k => k.trim())
            });
            setCreating(false);
            setNewTheme({ name: '', description: '', keywords: '', schedule: 'weekly' });
            fetchThemes();
        } catch (error) {
            console.error("Error creating theme:", error);
            alert("Failed to create theme.");
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.post(`${API_URL}/themes/${id}/activate`);
            fetchThemes();
        } catch (error) {
            console.error("Error activating theme:", error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Cannot activate: ${error.response.data.detail}`);
            } else {
                alert("Failed to activate theme.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this theme?")) return;
        try {
            await axios.delete(`${API_URL}/themes/${id}`);
            fetchThemes();
        } catch (error) {
            console.error("Error deleting theme:", error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Failed to delete theme: ${error.response.data.detail}`);
            } else {
                alert("Failed to delete theme. Please check console for details.");
            }
        }
    };

    const handleSaveEdit = async (theme) => {
        console.log("Saving theme edit:", theme);
        try {
            const res = await axios.put(`${API_URL}/themes/${theme.id}`, {
                name: theme.name,
                description: theme.description,
                keywords: theme.keywords,
                schedule: theme.schedule,
                status: theme.status // Ensure status is sent
            });
            console.log("Theme updated:", res.data);
            setEditingTheme(null);
            fetchThemes();
        } catch (error) {
            console.error("Error updating theme:", error);
            alert("Failed to update theme.");
        }
    };

    const [selectedThemes, setSelectedThemes] = useState([]);

    const toggleSelection = (id) => {
        if (selectedThemes.includes(id)) {
            setSelectedThemes(selectedThemes.filter(tid => tid !== id));
        } else {
            setSelectedThemes([...selectedThemes, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedThemes.length === 0) return;
        if (!confirm(`Delete ${selectedThemes.length} selected themes?`)) return;

        try {
            await axios.post(`${API_URL}/themes/bulk-delete`, { theme_ids: selectedThemes });
            setSelectedThemes([]);
            fetchThemes();
        } catch (error) {
            console.error("Error deleting themes:", error);
            alert("Failed to delete selected themes.");
        }
    };

    const handleClearAll = async () => {
        if (themes.length === 0) return;
        if (!confirm("Are you sure you want to DELETE ALL themes? This cannot be undone.")) return;

        const allIds = themes.map(t => t.id);
        try {
            await axios.post(`${API_URL}/themes/bulk-delete`, { theme_ids: allIds });
            setSelectedThemes([]);
            fetchThemes();
        } catch (error) {
            console.error("Error clearing themes:", error);
            alert("Failed to clear themes.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header & Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload docs</h1>
                <p className="text-gray-500 mb-6">Upload documents to extract research themes or add them manually.</p>

                <div className="flex justify-center gap-4">
                    <label className="relative cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
                        {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        <span className="font-medium">{uploading ? "Extracting..." : "Upload Document"}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>

                    <button
                        onClick={() => setCreating(true)}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Add Manual Theme</span>
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {creating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Add New Theme</h3>
                        <input
                            className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                            placeholder="Theme Name"
                            value={newTheme.name}
                            onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                        />
                        <textarea
                            className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                            placeholder="Description"
                            value={newTheme.description}
                            onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                            rows={3}
                        />
                        <input
                            className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                            placeholder="Keywords (comma separated)"
                            value={newTheme.keywords}
                            onChange={(e) => setNewTheme({ ...newTheme, keywords: e.target.value })}
                        />
                        <select
                            className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                            value={newTheme.schedule}
                            onChange={(e) => setNewTheme({ ...newTheme, schedule: e.target.value })}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setCreating(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg">Cancel</button>
                            <button onClick={handleCreateTheme} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Themes List */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        Your Themes <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">{themes.length}/3</span>
                    </h2>

                    <div className="flex gap-2">
                        {selectedThemes.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                            >
                                Delete Selected ({selectedThemes.length})
                            </button>
                        )}
                        {themes.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6">
                    {themes.map((theme) => (
                        <div key={theme.id} className={`bg-white rounded-xl border p-6 transition-all relative ${theme.status === 'active' ? 'border-green-500 shadow-md ring-1 ring-green-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>

                            {/* Checkbox */}
                            <div className="absolute top-6 left-4">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={selectedThemes.includes(theme.id)}
                                    onChange={() => toggleSelection(theme.id)}
                                />
                            </div>

                            <div className="pl-8">
                                {editingTheme?.id === theme.id ? (
                                    // Edit Mode
                                    <div className="space-y-4">
                                        <input
                                            className="w-full text-lg font-bold border-b border-gray-300 focus:border-blue-500 outline-none pb-1"
                                            value={editingTheme.name}
                                            onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                                        />
                                        <textarea
                                            className="w-full text-gray-600 border rounded p-2 focus:border-blue-500 outline-none"
                                            value={editingTheme.description}
                                            onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
                                            rows={2}
                                        />
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keywords</label>
                                            <input
                                                className="w-full mt-1 border rounded p-2 focus:border-blue-500 outline-none"
                                                value={Array.isArray(editingTheme.keywords) ? editingTheme.keywords.join(", ") : editingTheme.keywords}
                                                onChange={(e) => setEditingTheme({ ...editingTheme, keywords: e.target.value.split(",").map(k => k.trim()) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule</label>
                                            <select
                                                className="w-full mt-1 border rounded p-2 focus:border-blue-500 outline-none"
                                                value={editingTheme.schedule || 'weekly'}
                                                onChange={(e) => setEditingTheme({ ...editingTheme, schedule: e.target.value })}
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button onClick={() => setEditingTheme(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg">Cancel</button>
                                            <button onClick={() => handleSaveEdit(editingTheme)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900">{theme.name}</h3>
                                                {theme.status === 'active' && (
                                                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full capitalize">
                                                    {theme.schedule || 'weekly'}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed">{theme.description}</p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {theme.keywords.map((k, i) => (
                                                    <span key={i} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full border border-gray-200">
                                                        #{k}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 min-w-max">
                                            <button
                                                onClick={() => setEditingTheme(theme)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Theme"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(theme.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Theme"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            {theme.status !== 'active' && (
                                                <button
                                                    onClick={() => handleActivate(theme.id)}
                                                    className="ml-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2 shadow-sm hover:shadow transition-all"
                                                >
                                                    <Play className="w-4 h-4" /> Activate
                                                </button>
                                            )}
                                            {theme.status === 'active' && (
                                                <button
                                                    onClick={() => handleSaveEdit({ ...theme, status: 'draft' })}
                                                    className="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 shadow-sm hover:shadow transition-all"
                                                >
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Stop Schedule
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {themes.length === 0 && !uploading && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No themes yet. Upload a document or add one manually.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeManager;

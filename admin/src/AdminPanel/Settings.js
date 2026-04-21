import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';

const Settings = () => {
    const [badWords, setBadWords] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchBadWords();
    }, []);

    const fetchBadWords = async () => {
        try {
            const res = await api.get('/settings/badwords');
            setBadWords(res.data.badWords || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load settings. You might not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        setError(null);
        try {
            await api.put('/settings/badwords', { badWords });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const word = inputValue.trim().toLowerCase();
            if (word && !badWords.includes(word)) {
                setBadWords([...badWords, word]);
            }
            setInputValue('');
        }
    };

    const removeWord = (wordToRemove) => {
        setBadWords(badWords.filter(word => word !== wordToRemove));
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Settings...</div>;

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative pb-4">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-none">Global Settings</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Application Configuration</p>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-2 border border-red-100"><AlertCircle size={20} />{error}</div>}
                {success && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl font-bold flex items-center gap-2 border border-green-100"><AlertCircle size={20} />Settings saved successfully!</div>}

                <div className="space-y-4 max-w-2xl">
                    <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">Profanity Filter (Auto-Moderation)</h3>
                    <p className="text-sm text-gray-500 font-medium">Add bad words to automatically flag posts and comments. Type a word and press Enter or Comma.</p>

                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a word and press Enter..."
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all font-medium text-gray-900"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        {badWords.length === 0 && <p className="text-gray-400 font-bold text-sm">No words added yet.</p>}
                        {badWords.map((word, index) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-xl font-bold text-sm flex items-center gap-2">
                                {word}
                                <button onClick={() => removeWord(word)} className="hover:text-red-900 font-black">&times;</button>
                            </span>
                        ))}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-black text-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

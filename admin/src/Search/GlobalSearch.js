import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const GlobalSearch = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);
    const prevPathRef = useRef(location.pathname);

    const getQueryFromUrl = () => new URLSearchParams(location.search).get('search') || '';
    const [query, setQuery] = useState(getQueryFromUrl());

    // Clear search when navigating to a different page
    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            setQuery('');
            const params = new URLSearchParams(location.search);
            if (params.has('search')) {
                params.delete('search');
                navigate({ search: params.toString() }, { replace: true });
            }
        }
    }, [location.pathname, location.search, navigate]);

    // Debounced URL update on query change
    useEffect(() => {
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(location.search);
            if (query.trim()) {
                params.set('search', query.trim());
            } else {
                params.delete('search');
            }
            const newSearch = params.toString();
            const currentSearch = location.search.replace('?', '');
            if (newSearch !== currentSearch) {
                navigate({ search: newSearch }, { replace: true });
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [query, location.search, navigate]);

    return (
        <div className="relative flex-1 max-w-xl mx-auto px-4" ref={searchRef}>
            <div className="relative group">
                <Search
                    size={16}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search anything..."
                    className="w-full bg-gray-50/50 border border-transparent rounded-2xl py-3 pl-12 pr-10 focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-medium text-sm text-gray-900 placeholder:text-gray-300"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;

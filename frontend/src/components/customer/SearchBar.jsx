import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Search by name or brand..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-valhala-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-valhala-accent text-white"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
import React from 'react';
import { CATEGORIES } from '../../utils/constants';

const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {
  return (
    <div className="relative">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full px-4 py-2 bg-valhala-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-valhala-accent text-white appearance-none cursor-pointer"
      >
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.icon} {category.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default CategoryFilter;
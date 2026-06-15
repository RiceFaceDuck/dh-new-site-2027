import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
      <button
        onClick={() => onSelectCategory('All')}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold snap-start transition-all ${
          selectedCategory === 'All'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        ทั้งหมด
      </button>
      
      {categories.map((cat, idx) => (
        <button
          key={idx}
          onClick={() => onSelectCategory(cat)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold snap-start transition-all capitalize ${
            selectedCategory === cat
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;

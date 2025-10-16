import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  name = 'dropdown',
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  searchPlaceholder = 'Search...',
  maxHeight = '200px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Sort options alphabetically by label
  const sortedOptions = [...options].sort((a, b) => 
    (a.label || a.name || a).localeCompare(b.label || b.name || b)
  );

  // Filter options based on search term
  const filteredOptions = sortedOptions.filter(option => {
    const label = option.label || option.name || option;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get display value
  const getDisplayValue = () => {
    if (!value) return '';
    const selectedOption = sortedOptions.find(option => 
      (option.value || option._id || option) === value
    );
    return selectedOption ? (selectedOption.label || selectedOption.name || selectedOption) : '';
  };

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    console.log('Option selected:', option);
    const optionValue = option.value || option._id || option;
    console.log('Option value:', optionValue);
    onChange({ target: { name: name, value: optionValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log('Click outside detected, dropdown ref:', dropdownRef.current, 'target:', event.target);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log('Closing dropdown due to outside click');
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search when dropdown closes and calculate position when opening
  useEffect(() => {
    console.log('Dropdown state changed, isOpen:', isOpen);
    if (isOpen) {
      calculateDropdownPosition();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <div className={`relative dropdown-container ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 100 : 'auto' }} data-dropdown="true">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Dropdown button clicked, disabled:', disabled, 'isOpen:', isOpen);
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-left text-sm focus:outline-none focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-plant-green-500 border-plant-green-500' : ''
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        <span className={`${getDisplayValue() ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {getDisplayValue() || placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80" 
          style={{ 
            zIndex: 99999, 
            position: 'fixed', 
            top: dropdownPosition.top, 
            left: dropdownPosition.left, 
            width: dropdownPosition.width,
            minWidth: '200px'
          }} 
          data-dropdown="true"
          ref={dropdownRef}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 relative"
            style={{ 
              maxHeight: maxHeight || '200px', // Use provided maxHeight or default to 200px
              scrollBehavior: 'smooth'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = option.value || option._id || option;
                const optionLabel = option.label || option.name || option;
                const isSelected = optionValue === value;

                return (
                  <button
                    key={`${optionValue || optionLabel || index}-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Option button clicked:', option);
                      handleOptionSelect(option);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-plant-green-50 dark:bg-plant-green-900 text-plant-green-700 dark:text-plant-green-300' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                    style={{ pointerEvents: 'auto', zIndex: 100000 }}
                  >
                    {optionLabel}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableDropdown; 
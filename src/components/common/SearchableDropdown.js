import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, ready: false });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const portalRef = useRef(null);

  // Memoize options processing to prevent unnecessary recalculations
  const safeOptions = useMemo(() => {
    return Array.isArray(options) ? options : [];
  }, [options]);
  
  // Sort options alphabetically by label, but keep the first option (usually "Select...") at the top
  const sortedOptions = useMemo(() => {
    if (safeOptions.length === 0) return [];
    return [
      safeOptions[0], // Keep first option (usually placeholder) at top
      ...safeOptions.slice(1).sort((a, b) => 
        (a.label || a.name || String(a)).localeCompare(b.label || b.name || String(b))
      )
    ];
  }, [safeOptions]);

  // Memoize filtered options
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return sortedOptions;
    return sortedOptions.filter(option => {
      const label = option.label || option.name || String(option);
      return label.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sortedOptions, searchTerm]);

  // Memoize display value
  const displayValue = useMemo(() => {
    if (!value) return '';
    const selectedOption = sortedOptions.find(option => {
      const optionValue = option.value || option._id || String(option);
      return String(optionValue) === String(value);
    });
    return selectedOption ? (selectedOption.label || selectedOption.name || String(selectedOption)) : '';
  }, [sortedOptions, value]);

  // Calculate dropdown position with callback to prevent stale closures
  const calculateDropdownPosition = useCallback(() => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Use getBoundingClientRect which already accounts for scroll
      // For fixed positioning, we use viewport coordinates
      const newPosition = {
        top: rect.bottom + 2, // Add small gap
        left: rect.left,
        width: Math.max(rect.width, 200), // Ensure minimum width
        ready: true
      };
      setDropdownPosition(newPosition);
    }
  }, [isOpen]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    const optionValue = option.value || option._id || String(option);
    onChange({ target: { name: name, value: optionValue } });
    setIsOpen(false);
    setSearchTerm('');
  }, [name, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      // Check if click is outside both the button and the portal
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        portalRef.current &&
        !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    // Use a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position when opening and reset when closing
  useEffect(() => {
    if (isOpen) {
      // Calculate position immediately
      calculateDropdownPosition();
      
      // Calculate again after a short delay to ensure accuracy
      const timeoutId1 = setTimeout(() => {
        calculateDropdownPosition();
      }, 10);
      
      // And once more after DOM settles
      const timeoutId2 = setTimeout(() => {
        calculateDropdownPosition();
      }, 50);
      
      // Also recalculate on scroll/resize
      const handleScroll = () => calculateDropdownPosition();
      const handleResize = () => calculateDropdownPosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setSearchTerm('');
      setDropdownPosition({ top: 0, left: 0, width: 0, ready: false });
    }
  }, [isOpen, calculateDropdownPosition]);

  return (
    <div className={`relative dropdown-container ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 100 : 'auto' }} data-dropdown="true">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
        <span className={`${displayValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && createPortal(
          <div 
            ref={portalRef}
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80" 
            style={{ 
              zIndex: 10000, 
              position: 'fixed', 
              top: dropdownPosition.ready ? `${dropdownPosition.top}px` : '-9999px', 
              left: dropdownPosition.ready ? `${dropdownPosition.left}px` : '-9999px', 
              width: dropdownPosition.width > 0 ? `${dropdownPosition.width}px` : '200px',
              minWidth: '200px',
              opacity: dropdownPosition.ready ? 1 : 0,
              pointerEvents: dropdownPosition.ready ? 'auto' : 'none',
              transition: 'opacity 0.1s ease-in-out'
            }} 
            data-dropdown="true"
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
                {sortedOptions.length === 0 ? 'No options available' : 'No options found'}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = option.value || option._id || String(option);
                const optionLabel = option.label || option.name || String(option);
                const isSelected = String(optionValue) === String(value);

                return (
                  <button
                    key={`${name}-${optionValue || optionLabel || index}-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
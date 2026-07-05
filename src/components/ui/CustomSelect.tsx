import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  label?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  className,
  id,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const listboxId = `customselect-listbox-${id || reactId}`;

  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Close on click outside / Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Keep highlighted option in view
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const openList = () => {
    setIsOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const selectOption = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openList();
          if (e.key === 'ArrowUp') {
            requestAnimationFrame(() =>
              setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1),
            );
          }
        } else if (e.key === 'ArrowDown') {
          setActiveIndex((i) => (i + 1) % options.length);
        } else if (e.key === 'ArrowUp') {
          setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
        }
        break;
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) selectOption(options[activeIndex]);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default: {
        if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          const lower = e.key.toLowerCase();
          const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(lower));
          if (idx >= 0) setActiveIndex(idx);
        }
        break;
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button — ARIA combobox */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        aria-label={label}
        onClick={() => (isOpen ? setIsOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`
                    w-full flex items-center justify-between
                    pl-10 pr-4 py-2.5 rounded-xl border
                    text-left transition-all duration-200
                    ${
                      isOpen
                        ? 'border-[#0f766e] ring-2 ring-[#0f766e]/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-[#0f766e] dark:hover:border-[#0f766e]'
                    }
                    bg-slate-50 dark:bg-slate-800
                    text-slate-900 dark:text-white
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40
                    ${className}
                `}
      >
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </span>
        )}

        <span className="truncate font-medium">
          {options[selectedIndex]?.label || 'Sélectionner...'}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu — ARIA listbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-2 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-400/10 dark:shadow-black/40"
          >
            <div
              ref={listRef}
              role="listbox"
              id={listboxId}
              tabIndex={-1}
              onKeyDown={handleListKeyDown}
              className="max-h-60 overflow-y-auto py-1 custom-scrollbar outline-none"
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={option.value}
                    role="option"
                    id={`${listboxId}-opt-${index}`}
                    data-option-index={index}
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`
                                        w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer
                                        ${
                                          isSelected
                                            ? 'bg-[#0f766e]/10 text-[#0f766e] dark:text-[#5eead4]'
                                            : isActive
                                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }
                                    `}
                  >
                    {option.label}
                    {isSelected && <Check className="w-4 h-4 ml-2" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

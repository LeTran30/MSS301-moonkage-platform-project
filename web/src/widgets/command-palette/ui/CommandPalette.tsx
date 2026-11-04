import { useEffect, useMemo, useRef, useState } from 'react';
import { useCommandRegistry } from '../model/useCommandRegistry';
import type { CommandItem } from '../model/commandTypes';
import { CommandPaletteView } from './CommandPaletteView';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useCommandRegistry();

  // Lắng nghe phím tắt Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            setQuery('');
            setActiveIndex(0);
          }
          return !prev;
        });
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus khi mở
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = filteredCommands[activeIndex];
      if (command) {
        command.action();
        setIsOpen(false);
      }
    }
  }

  if (!isOpen) return null;

  const handleSelect = (command: CommandItem) => {
    command.action();
    setIsOpen(false);
  };

  return (
    <CommandPaletteView
      query={query}
      activeIndex={activeIndex}
      commands={filteredCommands}
      inputRef={inputRef}
      onQueryChange={(value) => {
        setQuery(value);
        setActiveIndex(0);
      }}
      onKeyDown={handleInputKeyDown}
      onSelect={handleSelect}
      onHover={setActiveIndex}
      onClose={() => setIsOpen(false)}
    />
  );
}

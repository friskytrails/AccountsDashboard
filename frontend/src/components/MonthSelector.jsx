import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { Card, Box, Button, ButtonText, ButtonIcon, HStack, VStack, Text } from '@/components/ui';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function MonthSelector({ selectedMonth, selectedYear, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMonth = (monthIndex) => {
    onChange(monthIndex + 1, viewYear);
    setIsOpen(false);
  };

  const handleResetToCurrent = () => {
    onChange(9, 2026);
    setViewYear(2026);
    setIsOpen(false);
  };

  return (
    <Box className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2.5 px-3.5 py-2 bg-card/90 border-border/80 rounded-xl hover:border-primary/50 shadow-sm"
      >
        <ButtonIcon as={Calendar} className="text-primary w-4 h-4" />
        <ButtonText className="font-semibold text-foreground tracking-tight text-xs">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </ButtonText>
        <ButtonIcon as={ChevronDown} className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-72 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border-border/90 bg-card/95 backdrop-blur-2xl">
          {/* Year Navigator */}
          <HStack space="md" className="items-center justify-between mb-3 px-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewYear((y) => y - 1)}
              title="Previous year"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ButtonIcon as={ChevronLeft} />
            </Button>
            <Text size="sm" bold className="text-foreground font-mono">
              {viewYear}
            </Text>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewYear((y) => y + 1)}
              title="Next year"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ButtonIcon as={ChevronRight} />
            </Button>
          </HStack>

          {/* Month Grid */}
          <Box className="grid grid-cols-3 gap-1.5 mb-3">
            {MONTH_NAMES.map((name, idx) => {
              const isSelected = idx + 1 === selectedMonth && viewYear === selectedYear;
              return (
                <Button
                  key={name}
                  size="sm"
                  variant={isSelected ? 'default' : 'ghost'}
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    isSelected ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold' : ''
                  }`}
                >
                  <ButtonText>{name}</ButtonText>
                </Button>
              );
            })}
          </Box>

          {/* Quick Shortcuts */}
          <HStack space="sm" className="pt-2 border-t border-border/60 justify-between items-center text-xs">
            <Text size="2xs" className="text-muted-foreground">
              Period: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetToCurrent}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary"
            >
              <ButtonText>Current (Sep &apos;26)</ButtonText>
            </Button>
          </HStack>
        </Card>
      )}
    </Box>
  );
}

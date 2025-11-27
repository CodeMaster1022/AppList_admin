'use client';

import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceConfig {
  type: RecurrenceType;
  // For daily
  everyNDays?: number;
  // For weekly
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  everyNWeeks?: number;
  // For monthly
  dayOfMonth?: number; // 1-31, or -1 for last day
  everyNMonths?: number;
  // For custom
  customPattern?: string;
}

interface RecurrenceConfigProps {
  value: RecurrenceConfig | null;
  onChange: (config: RecurrenceConfig | null) => void;
  onClose: () => void;
  title?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export default function RecurrenceConfigModal({
  value,
  onChange,
  onClose,
  title = 'Configure Recurrence'
}: RecurrenceConfigProps) {
  const [config, setConfig] = useState<RecurrenceConfig>(
    value || { type: 'none' }
  );

  const handleTypeChange = (type: RecurrenceType) => {
    const newConfig: RecurrenceConfig = { type };
    
    if (type === 'daily') {
      newConfig.everyNDays = 1;
    } else if (type === 'weekly') {
      newConfig.daysOfWeek = [new Date().getDay()]; // Default to today
      newConfig.everyNWeeks = 1;
    } else if (type === 'monthly') {
      newConfig.dayOfMonth = new Date().getDate();
      newConfig.everyNMonths = 1;
    }
    
    setConfig(newConfig);
  };

  const toggleDayOfWeek = (day: number) => {
    if (config.type !== 'weekly') return;
    
    const days = config.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();
    
    setConfig({ ...config, daysOfWeek: newDays });
  };

  const getRecurrenceSummary = (): string => {
    if (config.type === 'none') return 'No recurrence';
    if (config.type === 'daily') {
      if (config.everyNDays === 1) return 'Daily';
      return `Every ${config.everyNDays} days`;
    }
    if (config.type === 'weekly') {
      const days = config.daysOfWeek || [];
      if (days.length === 0) return 'Weekly (no days selected)';
      if (days.length === 7) return 'Daily';
      if (days.length === 1) {
        const dayName = DAYS_OF_WEEK.find(d => d.value === days[0])?.fullLabel || '';
        const weeks = config.everyNWeeks === 1 ? '' : ` every ${config.everyNWeeks} weeks`;
        return `Every ${dayName}${weeks}`;
      }
      const dayLabels = days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ');
      const weeks = config.everyNWeeks === 1 ? '' : ` every ${config.everyNWeeks} weeks`;
      return `Every ${dayLabels}${weeks}`;
    }
    if (config.type === 'monthly') {
      const day = config.dayOfMonth || 1;
      const dayLabel = day === -1 ? 'last day' : `day ${day}`;
      const months = config.everyNMonths === 1 ? '' : ` every ${config.everyNMonths} months`;
      return `Monthly on ${dayLabel}${months}`;
    }
    return 'Custom';
  };

  const handleApply = () => {
    if (config.type === 'none') {
      onChange(null);
    } else {
      onChange(config);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recurrence Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Repeat
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="none"
                  checked={config.type === 'none'}
                  onChange={() => handleTypeChange('none')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">Does not repeat</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="daily"
                  checked={config.type === 'daily'}
                  onChange={() => handleTypeChange('daily')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">Daily</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="weekly"
                  checked={config.type === 'weekly'}
                  onChange={() => handleTypeChange('weekly')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">Weekly</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="monthly"
                  checked={config.type === 'monthly'}
                  onChange={() => handleTypeChange('monthly')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">Monthly</span>
              </label>
            </div>
          </div>

          {/* Daily Configuration */}
          {config.type === 'daily' && (
            <div className="pl-4 border-l-2 border-blue-500">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.everyNDays || 1}
                  onChange={(e) => setConfig({ ...config, everyNDays: parseInt(e.target.value) || 1 })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">day(s)</span>
              </div>
            </div>
          )}

          {/* Weekly Configuration */}
          {config.type === 'weekly' && (
            <div className="pl-4 border-l-2 border-blue-500 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={config.everyNWeeks || 1}
                    onChange={(e) => setConfig({ ...config, everyNWeeks: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">week(s)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  On days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = config.daysOfWeek?.includes(day.value) || false;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Configuration */}
          {config.type === 'monthly' && (
            <div className="pl-4 border-l-2 border-blue-500 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={config.everyNMonths || 1}
                    onChange={(e) => setConfig({ ...config, everyNMonths: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">month(s)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  On day
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={config.dayOfMonth || 1}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfig({ ...config, dayOfMonth: value === 'last' ? -1 : parseInt(value) });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Day {day}
                      </option>
                    ))}
                    <option value="last">Last day of month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {config.type !== 'none' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Summary:</p>
              <p className="text-sm text-blue-700">{getRecurrenceSummary()}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert RecurrenceConfig to string for storage
export function recurrenceConfigToString(config: RecurrenceConfig | null): string {
  if (!config || config.type === 'none') return '';
  
  if (config.type === 'daily') {
    return `daily:${config.everyNDays || 1}`;
  }
  
  if (config.type === 'weekly') {
    const days = (config.daysOfWeek || []).join(',');
    const weeks = config.everyNWeeks || 1;
    return `weekly:${weeks}:${days}`;
  }
  
  if (config.type === 'monthly') {
    const day = config.dayOfMonth || 1;
    const months = config.everyNMonths || 1;
    return `monthly:${months}:${day}`;
  }
  
  return '';
}

// Helper function to parse string to RecurrenceConfig
export function stringToRecurrenceConfig(str: string): RecurrenceConfig | null {
  if (!str) return null;
  
  const parts = str.split(':');
  if (parts[0] === 'daily') {
    return {
      type: 'daily',
      everyNDays: parseInt(parts[1]) || 1,
    };
  }
  
  if (parts[0] === 'weekly') {
    return {
      type: 'weekly',
      everyNWeeks: parseInt(parts[1]) || 1,
      daysOfWeek: parts[2] ? parts[2].split(',').map(d => parseInt(d)) : [],
    };
  }
  
  if (parts[0] === 'monthly') {
    return {
      type: 'monthly',
      everyNMonths: parseInt(parts[1]) || 1,
      dayOfMonth: parseInt(parts[2]) || 1,
    };
  }
  
  return null;
}

// Helper function to get human-readable summary
export function getRecurrenceSummary(config: RecurrenceConfig | null): string {
  if (!config || config.type === 'none') return 'No recurrence';
  
  if (config.type === 'daily') {
    if (config.everyNDays === 1) return 'Daily';
    return `Every ${config.everyNDays} days`;
  }
  
  if (config.type === 'weekly') {
    const days = config.daysOfWeek || [];
    if (days.length === 0) return 'Weekly (no days selected)';
    
    const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = days.map(d => DAYS_OF_WEEK[d]).join(', ');
    const weeks = config.everyNWeeks === 1 ? '' : ` every ${config.everyNWeeks} weeks`;
    return `Every ${dayLabels}${weeks}`;
  }
  
  if (config.type === 'monthly') {
    const day = config.dayOfMonth || 1;
    const dayLabel = day === -1 ? 'last day' : `day ${day}`;
    const months = config.everyNMonths === 1 ? '' : ` every ${config.everyNMonths} months`;
    return `Monthly on ${dayLabel}${months}`;
  }
  
  return 'Custom';
}


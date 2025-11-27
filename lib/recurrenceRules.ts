/**
 * Recurrence Rules Management
 * Stores and manages reusable recurrence patterns
 */

import { RecurrenceConfig, recurrenceConfigToString, stringToRecurrenceConfig } from '@/components/RecurrenceConfig';

export interface RecurrenceRule {
  id: number;
  name: string;
  description: string;
  config: RecurrenceConfig;
}

// Default recurrence rules
const defaultRules: RecurrenceRule[] = [
  {
    id: 1,
    name: 'Daily',
    description: 'Every day',
    config: { type: 'daily', everyNDays: 1 }
  },
  {
    id: 2,
    name: 'Every Weekday',
    description: 'Monday to Friday',
    config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [1, 2, 3, 4, 5] }
  },
  {
    id: 3,
    name: 'Every Monday',
    description: 'Every Monday',
    config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [1] }
  },
  {
    id: 4,
    name: 'Every Wednesday',
    description: 'Every Wednesday',
    config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [3] }
  },
  {
    id: 5,
    name: 'Every Friday',
    description: 'Every Friday',
    config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [5] }
  },
  {
    id: 6,
    name: 'Every 3 Days',
    description: 'Every 3 days',
    config: { type: 'daily', everyNDays: 3 }
  },
  {
    id: 7,
    name: 'Every 2 Weeks',
    description: 'Every 2 weeks',
    config: { type: 'weekly', everyNWeeks: 2, daysOfWeek: [1] }
  },
  {
    id: 8,
    name: 'Monthly - First Day',
    description: 'First day of every month',
    config: { type: 'monthly', everyNMonths: 1, dayOfMonth: 1 }
  },
  {
    id: 9,
    name: 'Monthly - Last Day',
    description: 'Last day of every month',
    config: { type: 'monthly', everyNMonths: 1, dayOfMonth: -1 }
  },
  {
    id: 10,
    name: 'Weekly - Monday & Friday',
    description: 'Every Monday and Friday',
    config: { type: 'weekly', everyNWeeks: 1, daysOfWeek: [1, 5] }
  }
];

// Get rules from localStorage or return defaults
export function getRecurrenceRules(): RecurrenceRule[] {
  if (typeof window === 'undefined') return defaultRules;
  
  try {
    const stored = localStorage.getItem('recurrenceRules');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults (user rules take precedence)
      const userRules = parsed.filter((r: RecurrenceRule) => r.id > 1000);
      return [...defaultRules, ...userRules];
    }
  } catch (error) {
    console.error('Error loading recurrence rules:', error);
  }
  
  return defaultRules;
}

// Save a new recurrence rule
export function saveRecurrenceRule(rule: Omit<RecurrenceRule, 'id'>): RecurrenceRule {
  const rules = getRecurrenceRules();
  const newId = Math.max(...rules.map(r => r.id), 0) + 1;
  const newRule: RecurrenceRule = { ...rule, id: newId };
  
  const userRules = rules.filter(r => r.id > 1000);
  const updatedRules = [...userRules, newRule];
  
  localStorage.setItem('recurrenceRules', JSON.stringify(updatedRules));
  return newRule;
}

// Update an existing recurrence rule
export function updateRecurrenceRule(id: number, rule: Partial<RecurrenceRule>): RecurrenceRule | null {
  const rules = getRecurrenceRules();
  const ruleIndex = rules.findIndex(r => r.id === id);
  
  if (ruleIndex === -1) return null;
  
  const updatedRule = { ...rules[ruleIndex], ...rule };
  const userRules = rules.filter(r => r.id > 1000);
  const updatedUserRules = userRules.map(r => r.id === id ? updatedRule : r);
  
  localStorage.setItem('recurrenceRules', JSON.stringify(updatedUserRules));
  return updatedRule;
}

// Delete a recurrence rule (only user-created rules can be deleted)
export function deleteRecurrenceRule(id: number): boolean {
  if (id <= 1000) return false; // Cannot delete default rules
  
  const rules = getRecurrenceRules();
  const userRules = rules.filter(r => r.id > 1000 && r.id !== id);
  
  localStorage.setItem('recurrenceRules', JSON.stringify(userRules));
  return true;
}

// Get a rule by ID
export function getRecurrenceRule(id: number): RecurrenceRule | null {
  const rules = getRecurrenceRules();
  return rules.find(r => r.id === id) || null;
}


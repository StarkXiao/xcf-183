import { useState } from 'react';
import type { Reminder } from '../types';

export function useReminderDomain(initialReminders: Reminder[] | (() => Reminder[])) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [showReminders, setShowReminders] = useState(true);

  return {
    reminders,
    setReminders,
    showReminders,
    setShowReminders,
  };
}

import { useState } from 'react';
import type { ScheduleItem } from '../types';
import { getCurrentTime } from '../utils/scheduleUtils';

export function useScheduleDomain(initialSchedule: ScheduleItem[]) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  return {
    schedule,
    setSchedule,
    currentTime,
    setCurrentTime,
  };
}

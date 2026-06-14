import type {
  ShiftConfig,
  ShiftAssignment,
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  WorkHoursStats,
  DailyAttendanceSummary,
} from '../types';
import { getCurrentTime } from './scheduleUtils';

const DAY_MINUTES = 24 * 60;
const STANDARD_WORK_HOURS = 8;
const OVERTIME_THRESHOLD = STANDARD_WORK_HOURS * 60;

const rawTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const calculateShiftDuration = (shift: ShiftConfig): number => {
  const start = rawTimeToMinutes(shift.startTime);
  const end = rawTimeToMinutes(shift.endTime);
  if (shift.isCrossDay || end < start) {
    return (DAY_MINUTES - start) + end;
  }
  return end - start;
};

export const formatMinutesToHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
};

export const calculateLateMinutes = (
  checkInTime: string,
  shiftStartTime: string,
  isCrossDay: boolean
): number => {
  const checkIn = rawTimeToMinutes(checkInTime);
  const start = rawTimeToMinutes(shiftStartTime);

  if (isCrossDay) {
    const adjustedCheckIn = checkIn < 12 * 60 ? checkIn + DAY_MINUTES : checkIn;
    const adjustedStart = start < 12 * 60 ? start + DAY_MINUTES : start;
    return Math.max(0, adjustedCheckIn - adjustedStart);
  }

  return Math.max(0, checkIn - start);
};

export const calculateEarlyLeaveMinutes = (
  checkOutTime: string,
  shiftEndTime: string,
  isCrossDay: boolean
): number => {
  const checkOut = rawTimeToMinutes(checkOutTime);
  const end = rawTimeToMinutes(shiftEndTime);

  if (isCrossDay) {
    const adjustedCheckOut = checkOut < 12 * 60 ? checkOut + DAY_MINUTES : checkOut;
    const adjustedEnd = end < 12 * 60 ? end + DAY_MINUTES : end;
    return Math.max(0, adjustedEnd - adjustedCheckOut);
  }

  return Math.max(0, end - checkOut);
};

export const calculateActualWorkMinutes = (
  checkInTime: string,
  checkOutTime: string,
  isCrossDay: boolean
): number => {
  const checkIn = rawTimeToMinutes(checkInTime);
  const checkOut = rawTimeToMinutes(checkOutTime);

  if (isCrossDay || checkOut < checkIn) {
    const adjustedCheckOut = checkOut < checkIn ? checkOut + DAY_MINUTES : checkOut;
    return adjustedCheckOut - checkIn;
  }

  return checkOut - checkIn;
};

export const determineAttendanceStatus = (
  checkInTime: string | undefined,
  checkOutTime: string | undefined,
  lateMinutes: number,
  earlyLeaveMinutes: number,
  isOnLeave: boolean
): AttendanceStatus => {
  if (isOnLeave) return 'on_leave';
  if (!checkInTime) return 'absent';
  if (!checkOutTime) return 'checked_in';
  if (lateMinutes > 0 && earlyLeaveMinutes > 0) return 'late';
  if (lateMinutes > 0) return 'late';
  if (earlyLeaveMinutes > 0) return 'early_leave';
  return 'checked_out';
};

export const createCheckInRecord = (
  assignmentId: string,
  employeeId: string,
  date: string,
  shift: ShiftConfig
): AttendanceRecord => {
  const now = getCurrentTime();
  const lateMinutes = calculateLateMinutes(now, shift.startTime, shift.isCrossDay);

  return {
    id: `att-${Date.now()}`,
    employeeId,
    assignmentId,
    date,
    checkInTime: now,
    status: lateMinutes > 0 ? 'late' : 'checked_in',
    actualWorkMinutes: 0,
    lateMinutes,
    earlyLeaveMinutes: 0,
  };
};

export const createCheckOutRecord = (
  existingRecord: AttendanceRecord,
  shift: ShiftConfig
): AttendanceRecord => {
  const now = getCurrentTime();
  const checkInTime = existingRecord.checkInTime!;
  const actualWorkMinutes = calculateActualWorkMinutes(checkInTime, now, shift.isCrossDay);
  const earlyLeaveMinutes = calculateEarlyLeaveMinutes(now, shift.endTime, shift.isCrossDay);
  const status = determineAttendanceStatus(
    checkInTime,
    now,
    existingRecord.lateMinutes,
    earlyLeaveMinutes,
    false
  );

  return {
    ...existingRecord,
    checkOutTime: now,
    status,
    actualWorkMinutes,
    earlyLeaveMinutes,
  };
};

export const calculateWorkHoursStats = (
  records: AttendanceRecord[],
  employees: Employee[]
): WorkHoursStats[] => {
  return employees.map(employee => {
    const employeeRecords = records.filter(r => r.employeeId === employee.id);
    const workDays = employeeRecords.filter(r => r.status !== 'absent' && r.status !== 'on_leave').length;
    const totalWorkMinutes = employeeRecords.reduce((sum, r) => sum + r.actualWorkMinutes, 0);
    const totalWorkHours = Math.round((totalWorkMinutes / 60) * 100) / 100;
    const regularMinutes = Math.min(totalWorkMinutes, workDays * OVERTIME_THRESHOLD);
    const overtimeMinutes = Math.max(0, totalWorkMinutes - workDays * OVERTIME_THRESHOLD);
    const lateCount = employeeRecords.filter(r => r.status === 'late').length;
    const earlyLeaveCount = employeeRecords.filter(r => r.status === 'early_leave').length;
    const absentCount = employeeRecords.filter(r => r.status === 'absent').length;
    const scheduledDays = employeeRecords.length;
    const attendanceRate = scheduledDays > 0
      ? Math.round(((scheduledDays - absentCount) / scheduledDays) * 100)
      : 0;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      totalDays: workDays,
      totalWorkHours,
      regularHours: Math.round((regularMinutes / 60) * 100) / 100,
      overtimeHours: Math.round((overtimeMinutes / 60) * 100) / 100,
      lateCount,
      earlyLeaveCount,
      absentCount,
      attendanceRate,
    };
  });
};

export const calculateDailyAttendanceSummary = (
  assignments: ShiftAssignment[],
  records: AttendanceRecord[],
  date: string
): DailyAttendanceSummary => {
  const dayAssignments = assignments.filter(a => a.date === date);
  const dayRecords = records.filter(r => r.date === date);
  const totalScheduled = dayAssignments.length;
  const checkedIn = dayRecords.filter(r => r.checkInTime).length;
  const absent = dayRecords.filter(r => r.status === 'absent').length;
  const late = dayRecords.filter(r => r.status === 'late').length;
  const attendanceRate = totalScheduled > 0
    ? Math.round(((totalScheduled - absent) / totalScheduled) * 100)
    : 0;

  return {
    date,
    totalScheduled,
    totalCheckedIn: checkedIn,
    totalAbsent: absent,
    totalLate: late,
    attendanceRate,
  };
};

export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  employees: Employee[],
  shifts: ShiftConfig[],
  assignments: ShiftAssignment[]
): string => {
  const headers = ['日期', '员工姓名', '职位', '班次', '工作区域', '签到时间', '签退时间', '状态', '工时(小时)', '迟到(分钟)', '早退(分钟)', '备注'];
  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const shiftMap = new Map(shifts.map(s => [s.id, s]));
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));

  const statusLabels: Record<AttendanceStatus, string> = {
    checked_in: '已签到',
    checked_out: '已签退',
    absent: '缺勤',
    late: '迟到',
    early_leave: '早退',
    on_leave: '请假',
  };

  const rows = records.map(record => {
    const employee = employeeMap.get(record.employeeId);
    const assignment = assignmentMap.get(record.assignmentId);
    const shift = assignment ? shiftMap.get(assignment.shiftId) : undefined;

    return [
      record.date,
      employee?.name || '未知',
      employee?.position || '未知',
      shift?.name || '未知',
      assignment?.areaId || '未知',
      record.checkInTime || '-',
      record.checkOutTime || '-',
      statusLabels[record.status],
      (record.actualWorkMinutes / 60).toFixed(2),
      record.lateMinutes.toString(),
      record.earlyLeaveMinutes.toString(),
      record.notes || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (content: string, filename: string): void => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getStatusLabel = (status: AttendanceStatus): string => {
  const labels: Record<AttendanceStatus, string> = {
    checked_in: '已签到',
    checked_out: '已签退',
    absent: '缺勤',
    late: '迟到',
    early_leave: '早退',
    on_leave: '请假',
  };
  return labels[status];
};

export const getStatusColor = (status: AttendanceStatus): string => {
  const colors: Record<AttendanceStatus, string> = {
    checked_in: 'bg-blue-100 text-blue-800 border-blue-300',
    checked_out: 'bg-green-100 text-green-800 border-green-300',
    absent: 'bg-red-100 text-red-800 border-red-300',
    late: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    early_leave: 'bg-orange-100 text-orange-800 border-orange-300',
    on_leave: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[status];
};

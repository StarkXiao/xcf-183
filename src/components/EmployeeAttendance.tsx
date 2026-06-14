import { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  MapPin,
  LogIn,
  LogOut,
  BarChart3,
  Download,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Calendar,
  UserPlus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import type {
  Employee,
  ShiftConfig,
  WorkArea,
  ShiftAssignment,
  AttendanceRecord,
  WorkHoursStats,
  DailyAttendanceSummary,
} from '../types';
import {
  calculateShiftDuration,
  formatMinutesToHours,
  createCheckInRecord,
  createCheckOutRecord,
  calculateWorkHoursStats,
  calculateDailyAttendanceSummary,
  exportAttendanceToCSV,
  downloadCSV,
  getStatusLabel,
  getStatusColor,
} from '../utils/attendanceUtils';
import { formatDate } from '../utils/historyUtils';

interface EmployeeAttendanceProps {
  employees: Employee[];
  shifts: ShiftConfig[];
  areas: WorkArea[];
  assignments: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
  currentTime: string;
  onUpdateAssignments: (assignments: ShiftAssignment[]) => void;
  onUpdateAttendanceRecords: (records: AttendanceRecord[]) => void;
  onUpdateShifts: (shifts: ShiftConfig[]) => void;
  onUpdateEmployees: (employees: Employee[]) => void;
}

type SubTab = 'shifts' | 'assignment' | 'attendance' | 'statistics';

const SHIFT_COLOR_OPTIONS = [
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-teal-100 text-teal-800 border-teal-300',
];

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
];

export default function EmployeeAttendance({
  employees,
  shifts,
  areas,
  assignments,
  attendanceRecords,
  currentTime,
  onUpdateAssignments,
  onUpdateAttendanceRecords,
  onUpdateShifts,
  onUpdateEmployees,
}: EmployeeAttendanceProps) {
  const [subTab, setSubTab] = useState<SubTab>('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftConfig | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const todayAssignments = useMemo(
    () => assignments.filter(a => a.date === selectedDate),
    [assignments, selectedDate]
  );

  const todayRecords = useMemo(
    () => attendanceRecords.filter(r => r.date === selectedDate),
    [attendanceRecords, selectedDate]
  );

  const dailySummary = useMemo(
    () => calculateDailyAttendanceSummary(assignments, attendanceRecords, selectedDate),
    [assignments, attendanceRecords, selectedDate]
  );

  const workHoursStats = useMemo(
    () => calculateWorkHoursStats(attendanceRecords, employees),
    [attendanceRecords, employees]
  );

  const handleCheckIn = (assignment: ShiftAssignment) => {
    const shift = shifts.find(s => s.id === assignment.shiftId);
    if (!shift) return;
    const existingRecord = todayRecords.find(r => r.assignmentId === assignment.id);
    if (existingRecord) return;
    const newRecord = createCheckInRecord(assignment.id, assignment.employeeId, selectedDate, shift);
    onUpdateAttendanceRecords([...attendanceRecords, newRecord]);
  };

  const handleCheckOut = (assignment: ShiftAssignment) => {
    const shift = shifts.find(s => s.id === assignment.shiftId);
    if (!shift) return;
    const existingRecord = todayRecords.find(r => r.assignmentId === assignment.id);
    if (!existingRecord || existingRecord.checkOutTime) return;
    const updatedRecord = createCheckOutRecord(existingRecord, shift);
    onUpdateAttendanceRecords(
      attendanceRecords.map(r => (r.id === existingRecord.id ? updatedRecord : r))
    );
  };

  const handleExportCSV = () => {
    const csv = exportAttendanceToCSV(attendanceRecords, employees, shifts, assignments);
    downloadCSV(csv, `考勤记录_${formatDate(new Date())}.csv`);
  };

  const getRecordForAssignment = (assignmentId: string) =>
    todayRecords.find(r => r.assignmentId === assignmentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSubTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'attendance'
                ? 'bg-white text-green-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            签到签退
          </button>
          <button
            onClick={() => setSubTab('assignment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'assignment'
                ? 'bg-white text-blue-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            排班分派
          </button>
          <button
            onClick={() => setSubTab('shifts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'shifts'
                ? 'bg-white text-indigo-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            班次配置
          </button>
          <button
            onClick={() => setSubTab('statistics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'statistics'
                ? 'bg-white text-purple-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            工时统计
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm bg-transparent outline-none text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Timer className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-mono">{currentTime}</span>
          </div>
          {subTab === 'statistics' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出CSV
            </button>
          )}
        </div>
      </div>

      {subTab === 'attendance' && (
        <AttendancePanel
          employees={employees}
          shifts={shifts}
          areas={areas}
          assignments={todayAssignments}
          dailySummary={dailySummary}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          getRecordForAssignment={getRecordForAssignment}
        />
      )}

      {subTab === 'assignment' && (
        <AssignmentPanel
          employees={employees}
          shifts={shifts}
          areas={areas}
          assignments={assignments}
          todayAssignments={todayAssignments}
          selectedDate={selectedDate}
          onUpdateAssignments={onUpdateAssignments}
          showModal={showAssignmentModal}
          setShowModal={setShowAssignmentModal}
        />
      )}

      {subTab === 'shifts' && (
        <ShiftsPanel
          shifts={shifts}
          employees={employees}
          onUpdateShifts={onUpdateShifts}
          onUpdateEmployees={onUpdateEmployees}
          showShiftModal={showShiftModal}
          setShowShiftModal={setShowShiftModal}
          showEmployeeModal={showEmployeeModal}
          setShowEmployeeModal={setShowEmployeeModal}
          editingShift={editingShift}
          setEditingShift={setEditingShift}
          editingEmployee={editingEmployee}
          setEditingEmployee={setEditingEmployee}
        />
      )}

      {subTab === 'statistics' && (
        <StatisticsPanel
          workHoursStats={workHoursStats}
          attendanceRecords={attendanceRecords}
          assignments={assignments}
          employees={employees}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

function AttendancePanel({
  employees,
  shifts,
  areas,
  assignments,
  dailySummary,
  onCheckIn,
  onCheckOut,
  getRecordForAssignment,
}: {
  employees: Employee[];
  shifts: ShiftConfig[];
  areas: WorkArea[];
  assignments: ShiftAssignment[];
  dailySummary: DailyAttendanceSummary;
  onCheckIn: (assignment: ShiftAssignment) => void;
  onCheckOut: (assignment: ShiftAssignment) => void;
  getRecordForAssignment: (assignmentId: string) => AttendanceRecord | undefined;
}) {
  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const shiftMap = new Map(shifts.map(s => [s.id, s]));
  const areaMap = new Map(areas.map(a => [a.id, a]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="排班人数"
          value={dailySummary.totalScheduled}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="已签到"
          value={dailySummary.totalCheckedIn}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="迟到"
          value={dailySummary.totalLate}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="缺勤"
          value={dailySummary.totalAbsent}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="出勤率"
          value={`${dailySummary.attendanceRate}%`}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">今日考勤</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>今日暂无排班</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map(assignment => {
              const employee = employeeMap.get(assignment.employeeId);
              const shift = shiftMap.get(assignment.shiftId);
              const area = areaMap.get(assignment.areaId);
              const record = getRecordForAssignment(assignment.id);

              if (!employee || !shift) return null;

              return (
                <div key={assignment.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full ${employee.avatarColor} flex items-center justify-center text-white font-medium`}>
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{employee.name}</span>
                          <span className="text-xs text-gray-500">{employee.position}</span>
                          {record && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(record.status)}`}>
                              {getStatusLabel(record.status)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className={`px-2 py-0.5 rounded border ${shift.color}`}>
                            {shift.name} {shift.startTime}-{shift.endTime}
                          </span>
                          {area && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {area.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {record && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>签到: {record.checkInTime || '-'}</span>
                            {record.lateMinutes > 0 && (
                              <span className="text-yellow-600">(迟到{record.lateMinutes}分钟)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span>签退: {record.checkOutTime || '-'}</span>
                            {record.earlyLeaveMinutes > 0 && (
                              <span className="text-orange-600">(早退{record.earlyLeaveMinutes}分钟)</span>
                            )}
                          </div>
                          {record.actualWorkMinutes > 0 && (
                            <div className="text-gray-500 mt-1">
                              实际工时: {formatMinutesToHours(record.actualWorkMinutes)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!record && (
                          <button
                            onClick={() => onCheckIn(assignment)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <LogIn className="w-4 h-4" />
                            签到
                          </button>
                        )}
                        {record && !record.checkOutTime && (
                          <button
                            onClick={() => onCheckOut(assignment)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            签退
                          </button>
                        )}
                        {record && record.checkOutTime && (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                            已完成
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentPanel({
  employees,
  shifts,
  areas,
  assignments,
  todayAssignments,
  selectedDate,
  onUpdateAssignments,
  showModal,
  setShowModal,
}: {
  employees: Employee[];
  shifts: ShiftConfig[];
  areas: WorkArea[];
  assignments: ShiftAssignment[];
  todayAssignments: ShiftAssignment[];
  selectedDate: string;
  onUpdateAssignments: (assignments: ShiftAssignment[]) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) {
  const [newAssignment, setNewAssignment] = useState({
    employeeId: '',
    shiftId: '',
    areaId: '',
    notes: '',
  });

  const activeEmployees = employees.filter(e => e.status === 'active');
  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const areaMap = new Map(areas.map(a => [a.id, a]));

  const handleAddAssignment = () => {
    if (!newAssignment.employeeId || !newAssignment.shiftId || !newAssignment.areaId) return;
    const exists = todayAssignments.some(a => a.employeeId === newAssignment.employeeId);
    if (exists) {
      alert('该员工今日已有排班');
      return;
    }
    const assignment: ShiftAssignment = {
      id: `assign-${Date.now()}`,
      employeeId: newAssignment.employeeId,
      shiftId: newAssignment.shiftId,
      areaId: newAssignment.areaId,
      date: selectedDate,
      notes: newAssignment.notes || undefined,
    };
    onUpdateAssignments([...assignments, assignment]);
    setNewAssignment({ employeeId: '', shiftId: '', areaId: '', notes: '' });
    setShowModal(false);
  };

  const handleRemoveAssignment = (id: string) => {
    onUpdateAssignments(assignments.filter(a => a.id !== id));
  };

  const groupedByShift = useMemo(() => {
    const grouped = new Map<string, ShiftAssignment[]>();
    shifts.forEach(s => grouped.set(s.id, []));
    todayAssignments.forEach(a => {
      const list = grouped.get(a.shiftId) || [];
      list.push(a);
      grouped.set(a.shiftId, list);
    });
    return grouped;
  }, [todayAssignments, shifts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{selectedDate} 排班情况</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增排班
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shifts.map(shift => {
          const shiftAssignments = groupedByShift.get(shift.id) || [];
          return (
            <div key={shift.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-6 py-3 border-b border-gray-100 flex items-center justify-between ${shift.color}`}>
                <div>
                  <h4 className="font-semibold">{shift.name}</h4>
                  <p className="text-sm opacity-80">
                    {shift.startTime} - {shift.endTime}
                    {shift.isCrossDay && ' (跨天)'}
                  </p>
                </div>
                <span className="text-sm">
                  {shiftAssignments.length}/{shift.requiredStaff}人
                </span>
              </div>
              <div className="p-4 space-y-3">
                {shiftAssignments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">暂无安排</p>
                ) : (
                  shiftAssignments.map(a => {
                    const employee = employeeMap.get(a.employeeId);
                    const area = areaMap.get(a.areaId);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {employee && (
                            <div className={`w-9 h-9 rounded-full ${employee.avatarColor} flex items-center justify-center text-white text-sm font-medium`}>
                              {employee.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {employee?.name}
                              <span className="text-xs text-gray-500 ml-2">{employee?.position}</span>
                            </p>
                            {area && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {area.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(a.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">新增排班</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择员工</label>
                <select
                  value={newAssignment.employeeId}
                  onChange={e => setNewAssignment({ ...newAssignment, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择员工</option>
                  {activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} - {e.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择班次</label>
                <select
                  value={newAssignment.shiftId}
                  onChange={e => setNewAssignment({ ...newAssignment, shiftId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择班次</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime}-{s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工作区域</label>
                <select
                  value={newAssignment.areaId}
                  onChange={e => setNewAssignment({ ...newAssignment, areaId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择工作区域</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={newAssignment.notes}
                  onChange={e => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                  placeholder="可选"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftsPanel({
  shifts,
  employees,
  onUpdateShifts,
  onUpdateEmployees,
  showShiftModal,
  setShowShiftModal,
  showEmployeeModal,
  setShowEmployeeModal,
  editingShift,
  setEditingShift,
  editingEmployee,
  setEditingEmployee,
}: {
  shifts: ShiftConfig[];
  employees: Employee[];
  onUpdateShifts: (shifts: ShiftConfig[]) => void;
  onUpdateEmployees: (employees: Employee[]) => void;
  showShiftModal: boolean;
  setShowShiftModal: (show: boolean) => void;
  showEmployeeModal: boolean;
  setShowEmployeeModal: (show: boolean) => void;
  editingShift: ShiftConfig | null;
  setEditingShift: (shift: ShiftConfig | null) => void;
  editingEmployee: Employee | null;
  setEditingEmployee: (emp: Employee | null) => void;
}) {
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    color: SHIFT_COLOR_OPTIONS[0],
    requiredStaff: 2,
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    position: '',
    phone: '',
    status: 'active' as Employee['status'],
    avatarColor: AVATAR_COLORS[0],
  });

  const openAddShift = () => {
    setEditingShift(null);
    setShiftForm({ name: '', startTime: '08:00', endTime: '16:00', color: SHIFT_COLOR_OPTIONS[0], requiredStaff: 2 });
    setShowShiftModal(true);
  };

  const openEditShift = (shift: ShiftConfig) => {
    setEditingShift(shift);
    setShiftForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color,
      requiredStaff: shift.requiredStaff,
    });
    setShowShiftModal(true);
  };

  const handleSaveShift = () => {
    if (!shiftForm.name.trim()) return;
    const isCrossDay = shiftForm.startTime > shiftForm.endTime;
    if (editingShift) {
      onUpdateShifts(
        shifts.map(s =>
          s.id === editingShift.id
            ? { ...s, ...shiftForm, isCrossDay }
            : s
        )
      );
    } else {
      const newShift: ShiftConfig = {
        id: `shift-${Date.now()}`,
        ...shiftForm,
        isCrossDay,
      };
      onUpdateShifts([...shifts, newShift]);
    }
    setShowShiftModal(false);
  };

  const handleDeleteShift = (id: string) => {
    onUpdateShifts(shifts.filter(s => s.id !== id));
  };

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({ name: '', position: '', phone: '', status: 'active', avatarColor: AVATAR_COLORS[0] });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      name: emp.name,
      position: emp.position,
      phone: emp.phone,
      status: emp.status,
      avatarColor: emp.avatarColor,
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim()) return;
    if (editingEmployee) {
      onUpdateEmployees(
        employees.map(e =>
          e.id === editingEmployee.id
            ? { ...e, ...employeeForm }
            : e
        )
      );
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        ...employeeForm,
      };
      onUpdateEmployees([...employees, newEmp]);
    }
    setShowEmployeeModal(false);
  };

  const handleDeleteEmployee = (id: string) => {
    onUpdateEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            班次配置
          </h3>
          <button
            onClick={openAddShift}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增班次
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {shifts.map(shift => (
            <div key={shift.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${shift.color}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{shift.name}</p>
                  <p className="text-sm text-gray-500">
                    {shift.startTime} - {shift.endTime}
                    {shift.isCrossDay && ' (跨天)'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    时长: {formatMinutesToHours(calculateShiftDuration(shift))} · 需{shift.requiredStaff}人
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditShift(shift)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteShift(shift.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            员工管理
          </h3>
          <button
            onClick={openAddEmployee}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            新增员工
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {employees.map(emp => (
            <div key={emp.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full ${emp.avatarColor} flex items-center justify-center text-white font-medium`}>
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {emp.name}
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        emp.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : emp.status === 'leave'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {emp.status === 'active' ? '在职' : emp.status === 'leave' ? '休假' : '休息'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">{emp.position}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{emp.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditEmployee(emp)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showShiftModal && (
        <Modal title={editingShift ? '编辑班次' : '新增班次'} onClose={() => setShowShiftModal(false)}>
          <div className="space-y-4">
            <FormField label="班次名称">
              <input
                type="text"
                value={shiftForm.name}
                onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
                placeholder="如：早班、夜班"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="开始时间">
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FormField>
              <FormField label="结束时间">
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FormField>
            </div>
            <FormField label="所需人数">
              <input
                type="number"
                min="1"
                value={shiftForm.requiredStaff}
                onChange={e => setShiftForm({ ...shiftForm, requiredStaff: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>
            <FormField label="标签颜色">
              <div className="flex flex-wrap gap-2">
                {SHIFT_COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    onClick={() => setShiftForm({ ...shiftForm, color })}
                    className={`w-8 h-8 rounded-lg border-2 ${color} ${
                      shiftForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  />
                ))}
              </div>
            </FormField>
          </div>
          <ModalFooter onCancel={() => setShowShiftModal(false)} onConfirm={handleSaveShift} />
        </Modal>
      )}

      {showEmployeeModal && (
        <Modal title={editingEmployee ? '编辑员工' : '新增员工'} onClose={() => setShowEmployeeModal(false)}>
          <div className="space-y-4">
            <FormField label="姓名">
              <input
                type="text"
                value={employeeForm.name}
                onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                placeholder="员工姓名"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="职位">
              <input
                type="text"
                value={employeeForm.position}
                onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                placeholder="如：店长、收银员"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="联系电话">
              <input
                type="tel"
                value={employeeForm.phone}
                onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                placeholder="手机号码"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="状态">
              <select
                value={employeeForm.status}
                onChange={e => setEmployeeForm({ ...employeeForm, status: e.target.value as Employee['status'] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">在职</option>
                <option value="leave">休假</option>
                <option value="off">休息</option>
              </select>
            </FormField>
            <FormField label="头像颜色">
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEmployeeForm({ ...employeeForm, avatarColor: color })}
                    className={`w-8 h-8 rounded-full ${color} ${
                      employeeForm.avatarColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  />
                ))}
              </div>
            </FormField>
          </div>
          <ModalFooter onCancel={() => setShowEmployeeModal(false)} onConfirm={handleSaveEmployee} />
        </Modal>
      )}
    </div>
  );
}

function StatisticsPanel({
  workHoursStats,
}: {
  workHoursStats: WorkHoursStats[];
  attendanceRecords: AttendanceRecord[];
  assignments: ShiftAssignment[];
  employees: Employee[];
  selectedDate: string;
}) {
  const totalStats = useMemo(() => {
    return workHoursStats.reduce(
      (acc, s) => {
        acc.totalDays += s.totalDays;
        acc.totalWorkHours += s.totalWorkHours;
        acc.regularHours += s.regularHours;
        acc.overtimeHours += s.overtimeHours;
        acc.lateCount += s.lateCount;
        acc.earlyLeaveCount += s.earlyLeaveCount;
        acc.absentCount += s.absentCount;
        return acc;
      },
      { totalDays: 0, totalWorkHours: 0, regularHours: 0, overtimeHours: 0, lateCount: 0, earlyLeaveCount: 0, absentCount: 0 }
    );
  }, [workHoursStats]);

  const avgAttendanceRate =
    workHoursStats.length > 0
      ? Math.round(workHoursStats.reduce((sum, s) => sum + s.attendanceRate, 0) / workHoursStats.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Timer className="w-5 h-5" />}
          label="累计出勤天数"
          value={totalStats.totalDays}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="总工时"
          value={`${totalStats.totalWorkHours.toFixed(1)}h`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="平均出勤率"
          value={`${avgAttendanceRate}%`}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="异常次数"
          value={totalStats.lateCount + totalStats.earlyLeaveCount + totalStats.absentCount}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">员工工时明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-6 py-3 text-left font-medium">员工</th>
                <th className="px-6 py-3 text-right font-medium">出勤天数</th>
                <th className="px-6 py-3 text-right font-medium">总工时</th>
                <th className="px-6 py-3 text-right font-medium">正常工时</th>
                <th className="px-6 py-3 text-right font-medium">加班工时</th>
                <th className="px-6 py-3 text-right font-medium">迟到</th>
                <th className="px-6 py-3 text-right font-medium">早退</th>
                <th className="px-6 py-3 text-right font-medium">缺勤</th>
                <th className="px-6 py-3 text-right font-medium">出勤率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workHoursStats.map(stat => (
                <tr key={stat.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{stat.employeeName}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">{stat.totalDays}</td>
                  <td className="px-6 py-4 text-right text-gray-700 font-medium">{stat.totalWorkHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-right text-gray-600">{stat.regularHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-right">
                    {stat.overtimeHours > 0 ? (
                      <span className="text-orange-600 font-medium">{stat.overtimeHours.toFixed(1)}h</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {stat.lateCount > 0 ? (
                      <span className="text-yellow-600">{stat.lateCount}次</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {stat.earlyLeaveCount > 0 ? (
                      <span className="text-orange-600">{stat.earlyLeaveCount}次</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {stat.absentCount > 0 ? (
                      <span className="text-red-600">{stat.absentCount}次</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-medium ${
                        stat.attendanceRate >= 95
                          ? 'text-green-600'
                          : stat.attendanceRate >= 80
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-3 text-gray-800">合计</td>
                <td className="px-6 py-3 text-right text-gray-800">{totalStats.totalDays}</td>
                <td className="px-6 py-3 text-right text-gray-800">{totalStats.totalWorkHours.toFixed(1)}h</td>
                <td className="px-6 py-3 text-right text-gray-700">{totalStats.regularHours.toFixed(1)}h</td>
                <td className="px-6 py-3 text-right text-orange-600">{totalStats.overtimeHours.toFixed(1)}h</td>
                <td className="px-6 py-3 text-right text-yellow-600">{totalStats.lateCount}次</td>
                <td className="px-6 py-3 text-right text-orange-600">{totalStats.earlyLeaveCount}次</td>
                <td className="px-6 py-3 text-right text-red-600">{totalStats.absentCount}次</td>
                <td className="px-6 py-3 text-right text-green-600">{avgAttendanceRate}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmText = '保存',
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
}) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        取消
      </button>
      <button
        onClick={onConfirm}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Save className="w-4 h-4" />
        {confirmText}
      </button>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

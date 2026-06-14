import { useState } from 'react';
import { 
  ChefHat, Clock, AlertTriangle, CheckCircle, PlayCircle, 
  PauseCircle, ArrowRight, Thermometer, Shield, User, 
  Package, Timer, TrendingUp, LayoutGrid, List, Filter,
  ChevronDown, ChevronUp, AlertCircle, XCircle, Grip
} from 'lucide-react';
import type { ProcessingTask, ProcessingStation, ProcessingStatistics, ProcessingStep } from '../types';
import {
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getCategoryLabel,
  getWarningLevelColor,
  canAdvanceStatus,
  estimateFinishTime,
} from '../utils/processingUtils';

interface ProcessingBoardProps {
  tasks: ProcessingTask[];
  stations: ProcessingStation[];
  statistics: ProcessingStatistics;
  currentTime: string;
  onAdvanceTask: (taskId: string) => void;
  onUpdateStepStatus: (taskId: string, stepId: string, status: ProcessingStep['status']) => void;
}

type ViewMode = 'board' | 'list';
type FilterStatus = 'all' | ProcessingTask['status'];

export default function ProcessingBoard({
  tasks,
  stations,
  statistics,
  currentTime,
  onAdvanceTask,
  onUpdateStepStatus,
}: ProcessingBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (selectedStation && task.station !== selectedStation) return false;
    return true;
  });

  const groupedTasks = {
    queued: filteredTasks.filter(t => t.status === 'queued'),
    preparing: filteredTasks.filter(t => t.status === 'preparing'),
    cooking: filteredTasks.filter(t => t.status === 'cooking'),
    assembling: filteredTasks.filter(t => t.status === 'assembling'),
    packaging: filteredTasks.filter(t => t.status === 'packaging'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const getStationStatusColor = (status: ProcessingStation['status']) => {
    if (status === 'busy') return 'bg-green-500';
    if (status === 'idle') return 'bg-gray-300';
    return 'bg-yellow-500';
  };

  const getStationStatusLabel = (status: ProcessingStation['status']) => {
    if (status === 'busy') return '工作中';
    if (status === 'idle') return '空闲';
    return '维护中';
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color, subColor }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
    subColor?: string;
  }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subValue && <p className={`text-sm mt-1 ${subColor || 'text-gray-500'}`}>{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-50')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const TaskCard = ({ task }: { task: ProcessingTask }) => {
    const isExpanded = expandedTaskId === task.id;
    const estimatedFinish = estimateFinishTime(task, currentTime);
    const canAdvance = canAdvanceStatus(task);

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
          getWarningLevelColor(task.warningLevel)
        } ${task.warningLevel === 'critical' ? 'animate-pulse' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-800">{task.productName}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {getCategoryLabel(task.category)}
                </span>
                <span>x{task.quantity}</span>
                {task.orderSource && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                    {task.orderSource === 'online' ? '线上订单' : task.orderSource === 'in_store' ? '门店订单' : '批量生产'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
            {task.isOverdue && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                超时 {task.overdueMinutes! > 60 ? `${Math.floor(task.overdueMinutes! / 60)}h${task.overdueMinutes! % 60}m` : `${task.overdueMinutes}m`}
              </span>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">加工进度</span>
              <span className="font-semibold text-gray-800">{task.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  task.warningLevel === 'critical' ? 'bg-red-500' :
                  task.warningLevel === 'warning' ? 'bg-yellow-500' :
                  task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>预计 {estimatedFinish || '--:--'}</span>
            </div>
            {task.operator && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{task.operator}</span>
              </div>
            )}
          </div>

          {canAdvance && (
            <button
              onClick={() => onAdvanceTask(task.id)}
              className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              推进到下一阶段
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">计划时间:</span>
                <span className="font-medium text-gray-700">{task.scheduledTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">预计时长:</span>
                <span className="font-medium text-gray-700">{task.estimatedDuration}分钟</span>
              </div>
              {task.actualStartTime && (
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-500">开始时间:</span>
                  <span className="font-medium text-gray-700">{task.actualStartTime}</span>
                </div>
              )}
              {task.actualEndTime && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-500">完成时间:</span>
                  <span className="font-medium text-gray-700">{task.actualEndTime}</span>
                </div>
              )}
              {task.temperatureCheck?.required && (
                <div className="flex items-center gap-2 col-span-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-500">温度检测:</span>
                  <span className="font-medium text-gray-700">
                    {task.temperatureCheck.actualTemp}°C (目标: {task.temperatureCheck.targetTemp}°C)
                  </span>
                  {task.temperatureCheck.actualTemp! >= task.temperatureCheck.targetTemp! && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )}
              {task.qualityCheck?.required && (
                <div className="flex items-center gap-2 col-span-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-500">质检:</span>
                  <span className={`font-medium ${task.qualityCheck.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {task.qualityCheck.passed ? '已通过' : '未通过'}
                  </span>
                  {task.qualityCheck.checkedBy && (
                    <span className="text-gray-500">- {task.qualityCheck.checkedBy}</span>
                  )}
                </div>
              )}
              {task.notes && (
                <div className="flex items-start gap-2 col-span-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span className="text-gray-600">{task.notes}</span>
                </div>
              )}
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">加工步骤</h5>
              <div className="space-y-2">
                {task.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                      step.status === 'skipped' ? 'bg-gray-50 border-gray-200 opacity-50' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      step.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                      step.status === 'skipped' ? 'bg-gray-300 text-gray-500' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : step.status === 'in_progress' ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : step.status === 'skipped' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'in_progress' ? 'text-blue-700' :
                          'text-gray-700'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {step.estimatedDuration}分钟
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {step.startTime && <span>开始: {step.startTime}</span>}
                        {step.endTime && <span>完成: {step.endTime}</span>}
                        {step.operator && <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />{step.operator}
                        </span>}
                      </div>
                    </div>
                    {step.status === 'pending' && task.status !== 'completed' && task.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onUpdateStepStatus(task.id, step.id, 'in_progress')}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                          title="开始"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateStepStatus(task.id, step.id, 'skipped')}
                          className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
                          title="跳过"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {step.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateStepStatus(task.id, step.id, 'completed')}
                        className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                        title="完成"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const BoardColumn = ({ title, tasks, color, icon: Icon }: {
    title: string;
    tasks: ProcessingTask[];
    color: string;
    icon: any;
  }) => (
    <div className="flex flex-col min-w-80">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl ${color}`}>
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-sm font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 bg-gray-50 rounded-b-xl p-3 space-y-3 min-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Grip className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">暂无任务</p>
          </div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Package}
          label="总任务数"
          value={statistics.totalTasks}
          color="text-blue-600"
        />
        <StatCard
          icon={PlayCircle}
          label="进行中"
          value={statistics.inProgressTasks}
          color="text-orange-600"
        />
        <StatCard
          icon={CheckCircle}
          label="已完成"
          value={statistics.completedTasks}
          subValue={`${statistics.onTimeCompletionRate}% 准时率`}
          color="text-green-600"
          subColor="text-green-500"
        />
        <StatCard
          icon={Clock}
          label="排队中"
          value={statistics.pendingTasks}
          color="text-gray-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="超时任务"
          value={statistics.overdueTasks}
          subValue={statistics.overdueTasks > 0 ? '需要关注' : '一切正常'}
          color={statistics.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600'}
          subColor={statistics.overdueTasks > 0 ? 'text-red-500' : 'text-green-500'}
        />
        <StatCard
          icon={TrendingUp}
          label="今日产量"
          value={statistics.todayOutput}
          subValue={`平均 ${statistics.averageProcessingTime}分钟/份`}
          color="text-indigo-600"
          subColor="text-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-orange-500" />
          加工工位状态
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stations.map(station => {
            const stationTasks = tasks.filter(t => t.station === station.id);
            const activeTask = stationTasks.find(t => ['preparing', 'cooking', 'assembling', 'packaging'].includes(t.status));
            const utilization = statistics.stationUtilization.find(u => u.stationId === station.id);
            
            return (
              <div
                key={station.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedStation === station.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedStation(selectedStation === station.id ? null : station.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{station.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStationStatusColor(station.status)}`} />
                    <span className="text-xs text-gray-500">{getStationStatusLabel(station.status)}</span>
                  </div>
                </div>
                {activeTask && (
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    当前: {activeTask.productName}
                  </p>
                )}
                {utilization && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">利用率</span>
                      <span className="font-medium text-gray-700">{utilization.utilizationRate}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilization.utilizationRate >= 80 ? 'bg-green-500' :
                          utilization.utilizationRate >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${utilization.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              鲜食加工进度看板
            </h3>
            <span className="text-sm text-gray-500">
              当前时间: {currentTime}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="queued">排队中</option>
                <option value="preparing">准备中</option>
                <option value="cooking">加工中</option>
                <option value="assembling">组装中</option>
                <option value="packaging">包装中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                  viewMode === 'board'
                    ? 'bg-white text-blue-600 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                看板
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
                列表
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'board' ? (
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              <BoardColumn
                title="排队中"
                tasks={groupedTasks.queued}
                color="bg-gray-100 text-gray-700"
                icon={Clock}
              />
              <BoardColumn
                title="准备中"
                tasks={groupedTasks.preparing}
                color="bg-blue-100 text-blue-700"
                icon={PlayCircle}
              />
              <BoardColumn
                title="加工中"
                tasks={groupedTasks.cooking}
                color="bg-orange-100 text-orange-700"
                icon={ChefHat}
              />
              <BoardColumn
                title="组装中"
                tasks={groupedTasks.assembling}
                color="bg-purple-100 text-purple-700"
                icon={Package}
              />
              <BoardColumn
                title="包装中"
                tasks={groupedTasks.packaging}
                color="bg-indigo-100 text-indigo-700"
                icon={Package}
              />
              <BoardColumn
                title="已完成"
                tasks={groupedTasks.completed}
                color="bg-green-100 text-green-700"
                icon={CheckCircle}
              />
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ChefHat className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-lg">暂无符合条件的加工任务</p>
                <p className="text-sm mt-1">请尝试调整筛选条件</p>
              </div>
            ) : (
              filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

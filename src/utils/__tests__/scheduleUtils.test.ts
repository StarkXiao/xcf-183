import { describe, it, expect } from 'vitest';
import type { ScheduleItem } from '../../types';
import {
  getNextStatus,
  calculateTimeSlotStats,
  calculateTotalEstimatedFinishTime,
} from '../scheduleUtils';

describe('状态循环流转函数 getNextStatus', () => {
  it('pending 状态应流转到 in_progress', () => {
    expect(getNextStatus('pending')).toBe('in_progress');
  });

  it('in_progress 状态应流转到 completed', () => {
    expect(getNextStatus('in_progress')).toBe('completed');
  });

  it('completed 状态应循环回到 pending', () => {
    expect(getNextStatus('completed')).toBe('pending');
  });

  it('完整循环三次应回到初始状态', () => {
    const initial: 'pending' | 'in_progress' | 'completed' = 'pending';
    let current = initial;
    current = getNextStatus(current);
    expect(current).toBe('in_progress');
    current = getNextStatus(current);
    expect(current).toBe('completed');
    current = getNextStatus(current);
    expect(current).toBe(initial);
  });

  it('多次循环流转验证状态正确性', () => {
    const states: ('pending' | 'in_progress' | 'completed')[] = [];
    let current: 'pending' | 'in_progress' | 'completed' = 'pending';
    for (let i = 0; i < 10; i++) {
      states.push(current);
      current = getNextStatus(current);
    }
    expect(states[0]).toBe('pending');
    expect(states[1]).toBe('in_progress');
    expect(states[2]).toBe('completed');
    expect(states[3]).toBe('pending');
    expect(states[9]).toBe('pending');
  });

  it('从任意状态开始完整循环应回到原点', () => {
    const allStatuses: ('pending' | 'in_progress' | 'completed')[] = ['pending', 'in_progress', 'completed'];
    allStatuses.forEach(initial => {
      let current = initial;
      current = getNextStatus(current);
      current = getNextStatus(current);
      current = getNextStatus(current);
      expect(current).toBe(initial);
    });
  });
});

const createMockScheduleItem = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  id: 'task-1',
  productId: 'prod-1',
  productName: '测试商品',
  time: '20:00',
  quantity: 10,
  status: 'pending',
  estimatedDuration: 30,
  originalTime: '20:00',
  ...overrides,
});

describe('统计聚合函数 calculateTimeSlotStats', () => {
  it('空任务列表应返回所有时段统计为0', () => {
    const result = calculateTimeSlotStats([], '20:00');
    expect(result).toHaveLength(6);
    result.forEach(slot => {
      expect(slot.totalTasks).toBe(0);
      expect(slot.completedTasks).toBe(0);
      expect(slot.completionRate).toBe(0);
      expect(slot.isBottleneck).toBe(false);
    });
  });

  it('单个任务应正确归属到对应时段', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:30', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot20_22 = result.find(s => s.timeSlot === '20:00-22:00')!;
    expect(slot20_22.totalTasks).toBe(1);
    expect(slot20_22.completedTasks).toBe(0);
    expect(slot20_22.completionRate).toBe(0);
  });

  it('跨午夜时段任务应正确归属', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '23:30', status: 'pending' }),
      createMockScheduleItem({ id: 't2', originalTime: '00:30', status: 'completed' }),
      createMockScheduleItem({ id: 't3', originalTime: '01:30', status: 'in_progress' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot22_00 = result.find(s => s.timeSlot === '22:00-00:00')!;
    const slot00_02 = result.find(s => s.timeSlot === '00:00-02:00')!;
    expect(slot22_00.totalTasks).toBe(1);
    expect(slot00_02.totalTasks).toBe(2);
    expect(slot00_02.completedTasks).toBe(1);
  });

  it('完成率计算应正确四舍五入', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'completed' }),
      createMockScheduleItem({ id: 't2', originalTime: '20:30', status: 'completed' }),
      createMockScheduleItem({ id: 't3', originalTime: '21:00', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot = result.find(s => s.timeSlot === '20:00-22:00')!;
    expect(slot.completionRate).toBe(67);
  });

  it('全部完成时完成率应为100%', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'completed' }),
      createMockScheduleItem({ id: 't2', originalTime: '20:30', status: 'completed' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot = result.find(s => s.timeSlot === '20:00-22:00')!;
    expect(slot.completionRate).toBe(100);
  });

  it('全部未完成时完成率应为0%', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'pending' }),
      createMockScheduleItem({ id: 't2', originalTime: '20:30', status: 'in_progress' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot = result.find(s => s.timeSlot === '20:00-22:00')!;
    expect(slot.completionRate).toBe(0);
  });

  it('低于平均完成率的时段应标记为瓶颈', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'completed' }),
      createMockScheduleItem({ id: 't2', originalTime: '20:30', status: 'completed' }),
      createMockScheduleItem({ id: 't3', originalTime: '22:00', status: 'pending' }),
      createMockScheduleItem({ id: 't4', originalTime: '22:30', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot20_22 = result.find(s => s.timeSlot === '20:00-22:00')!;
    const slot22_00 = result.find(s => s.timeSlot === '22:00-00:00')!;
    expect(slot20_22.isBottleneck).toBe(false);
    expect(slot22_00.isBottleneck).toBe(true);
  });

  it('时段边界值应正确匹配（开始边界）', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot = result.find(s => s.timeSlot === '20:00-22:00')!;
    expect(slot.totalTasks).toBe(1);
  });

  it('时段边界值应正确匹配（结束边界）', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '22:00', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot20_22 = result.find(s => s.timeSlot === '20:00-22:00')!;
    const slot22_00 = result.find(s => s.timeSlot === '22:00-00:00')!;
    expect(slot20_22.totalTasks).toBe(0);
    expect(slot22_00.totalTasks).toBe(1);
  });

  it('多个时段多任务混合状态统计', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'completed' }),
      createMockScheduleItem({ id: 't2', originalTime: '21:00', status: 'pending' }),
      createMockScheduleItem({ id: 't3', originalTime: '22:00', status: 'completed' }),
      createMockScheduleItem({ id: 't4', originalTime: '23:00', status: 'completed' }),
      createMockScheduleItem({ id: 't5', originalTime: '00:00', status: 'pending' }),
      createMockScheduleItem({ id: 't6', originalTime: '01:00', status: 'in_progress' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    expect(result.find(s => s.timeSlot === '20:00-22:00')!.totalTasks).toBe(2);
    expect(result.find(s => s.timeSlot === '22:00-00:00')!.totalTasks).toBe(2);
    expect(result.find(s => s.timeSlot === '00:00-02:00')!.totalTasks).toBe(2);
    expect(result.find(s => s.timeSlot === '20:00-22:00')!.completionRate).toBe(50);
    expect(result.find(s => s.timeSlot === '22:00-00:00')!.completionRate).toBe(100);
    expect(result.find(s => s.timeSlot === '00:00-02:00')!.completionRate).toBe(0);
  });

  it('凌晨时段跨日边界处理', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '06:00', status: 'completed' }),
      createMockScheduleItem({ id: 't2', originalTime: '07:59', status: 'pending' }),
    ];
    const result = calculateTimeSlotStats(schedule, '20:00');
    const slot = result.find(s => s.timeSlot === '06:00-08:00')!;
    expect(slot.totalTasks).toBe(2);
    expect(slot.completedTasks).toBe(1);
  });
});

describe('统计聚合函数 calculateTotalEstimatedFinishTime', () => {
  it('空任务列表应返回 undefined', () => {
    const result = calculateTotalEstimatedFinishTime([], '20:00');
    expect(result).toBeUndefined();
  });

  it('全部任务已完成应返回 undefined', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', status: 'completed', originalTime: '20:00' }),
      createMockScheduleItem({ id: 't2', status: 'completed', originalTime: '21:00' }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:00');
    expect(result).toBeUndefined();
  });

  it('仅有进行中任务应正确计算剩余时间', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'in_progress',
        originalTime: '20:00',
        actualStartTime: '20:00',
        estimatedDuration: 60,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:30');
    expect(result).toBe('21:00');
  });

  it('进行中任务已超时应立即完成', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'in_progress',
        originalTime: '20:00',
        actualStartTime: '20:00',
        estimatedDuration: 30,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '21:00');
    expect(result).toBe('21:00');
  });

  it('仅有待处理任务应累加所有时长', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', status: 'pending', originalTime: '20:00', estimatedDuration: 30 }),
      createMockScheduleItem({ id: 't2', status: 'pending', originalTime: '20:30', estimatedDuration: 45 }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:00');
    expect(result).toBe('21:15');
  });

  it('混合状态任务应正确计算', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'in_progress',
        originalTime: '20:00',
        actualStartTime: '20:00',
        estimatedDuration: 60,
      }),
      createMockScheduleItem({
        id: 't2',
        status: 'pending',
        originalTime: '21:00',
        estimatedDuration: 30,
      }),
      createMockScheduleItem({
        id: 't3',
        status: 'completed',
        originalTime: '19:00',
        estimatedDuration: 30,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:30');
    expect(result).toBe('21:30');
  });

  it('已阻塞的待处理任务应排除在计算外', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'pending',
        originalTime: '20:00',
        estimatedDuration: 30,
      }),
      createMockScheduleItem({
        id: 't2',
        status: 'pending',
        originalTime: '20:30',
        estimatedDuration: 45,
        prerequisiteIds: ['t1'],
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:00');
    expect(result).toBe('20:30');
  });

  it('跨午夜完成时间应正确显示', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'pending',
        originalTime: '23:00',
        estimatedDuration: 120,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '23:00');
    expect(result).toBe('01:00');
  });

  it('长时间任务跨多天应正确模运算', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'pending',
        originalTime: '20:00',
        estimatedDuration: 60 * 24 + 30,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:00');
    expect(result).toBe('20:30');
  });

  it('仅包含阻塞任务时应返回 undefined', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'pending',
        originalTime: '20:00',
        estimatedDuration: 30,
        prerequisiteIds: ['t2'],
      }),
      createMockScheduleItem({
        id: 't2',
        status: 'pending',
        originalTime: '20:30',
        estimatedDuration: 45,
        prerequisiteIds: ['t1'],
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:00');
    expect(result).toBeUndefined();
  });

  it('进行中任务 + 多个待处理任务累计计算', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'in_progress',
        originalTime: '20:00',
        actualStartTime: '20:00',
        estimatedDuration: 30,
      }),
      createMockScheduleItem({
        id: 't2',
        status: 'pending',
        originalTime: '20:30',
        estimatedDuration: 15,
      }),
      createMockScheduleItem({
        id: 't3',
        status: 'pending',
        originalTime: '20:45',
        estimatedDuration: 20,
      }),
      createMockScheduleItem({
        id: 't4',
        status: 'pending',
        originalTime: '21:05',
        estimatedDuration: 25,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:15');
    expect(result).toBe('21:30');
  });

  it('使用 originalTime 作为 actualStartTime 回退值', () => {
    const schedule = [
      createMockScheduleItem({
        id: 't1',
        status: 'in_progress',
        originalTime: '20:00',
        estimatedDuration: 60,
      }),
    ];
    const result = calculateTotalEstimatedFinishTime(schedule, '20:30');
    expect(result).toBe('21:00');
  });
});

describe('状态流转与统计聚合组合场景', () => {
  it('状态流转后统计应正确更新', () => {
    const schedule: ScheduleItem[] = [
      createMockScheduleItem({ id: 't1', originalTime: '20:00', status: 'pending' }),
    ];
    
    const stats1 = calculateTimeSlotStats(schedule, '20:00');
    expect(stats1.find(s => s.timeSlot === '20:00-22:00')!.completionRate).toBe(0);
    
    schedule[0].status = getNextStatus(schedule[0].status);
    const stats2 = calculateTimeSlotStats(schedule, '20:00');
    expect(stats2.find(s => s.timeSlot === '20:00-22:00')!.completionRate).toBe(0);
    
    schedule[0].status = getNextStatus(schedule[0].status);
    const stats3 = calculateTimeSlotStats(schedule, '20:00');
    expect(stats3.find(s => s.timeSlot === '20:00-22:00')!.completionRate).toBe(100);
  });

  it('异常状态组合下统计函数应鲁棒处理', () => {
    const schedule = [
      createMockScheduleItem({ id: 't1', originalTime: '99:99', status: 'pending' }),
      createMockScheduleItem({ id: 't2', originalTime: '20:00', status: 'pending', estimatedDuration: -10 }),
    ];
    expect(() => calculateTimeSlotStats(schedule, '20:00')).not.toThrow();
    expect(() => calculateTotalEstimatedFinishTime(schedule, '20:00')).not.toThrow();
  });
});

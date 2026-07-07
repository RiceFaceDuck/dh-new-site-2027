import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSourcingRequests } from './useSourcingRequests';

// Mock Firebase
vi.mock('../../../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn().mockResolvedValue(true),
    onSnapshot: vi.fn((q, callback) => {
      // จำลองข้อมูล Snapshot ให้ callback ทันที
      callback({
        docs: [
          { id: '1', data: () => ({ name: 'Test Product 1', demandCount: 5, status: 'pending' }) },
          { id: '2', data: () => ({ name: 'Test Product 2', demandCount: 2, status: 'pending' }) }
        ]
      });
      // จำลองฟังก์ชัน unsubscribe
      return vi.fn();
    })
  };
});

describe('useSourcingRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตั้งค่าเริ่มต้น (Initial State) อย่างถูกต้องและดึงข้อมูลได้', () => {
    const { result } = renderHook(() => useSourcingRequests());

    // ทดสอบว่า loading กลายเป็น false และมีข้อมูลหลังจากดึงเสร็จ
    expect(result.current.loading).toBe(false);
    expect(result.current.requests).toHaveLength(2);
    expect(result.current.requests[0].id).toBe('1');
    expect(result.current.requests[0].name).toBe('Test Product 1');
  });

  it('สามารถเรียกฟังก์ชัน updateStatus ได้โดยไม่มีข้อผิดพลาด', async () => {
    const { result } = renderHook(() => useSourcingRequests());
    
    let isSuccess = false;
    await act(async () => {
      isSuccess = await result.current.updateStatus('1', 'imported');
    });

    expect(isSuccess).toBe(true);
  });
});

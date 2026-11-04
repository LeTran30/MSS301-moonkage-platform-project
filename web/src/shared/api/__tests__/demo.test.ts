import { describe, it, expect, vi } from 'vitest';
import { executeWithDemoMode } from '../demo';
import * as envModule from '@/shared/config/env';

describe('Shared API - executeWithDemoMode (N1, N3)', () => {
  it('gọi demoCall khi isDemoMode() trả về true', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(true);

    const apiCall = vi.fn().mockResolvedValue('from_api');
    const demoCall = vi.fn().mockResolvedValue('from_demo');

    const result = await executeWithDemoMode(apiCall, demoCall);
    expect(result).toBe('from_demo');
    expect(apiCall).not.toHaveBeenCalled();
    expect(demoCall).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('gọi apiCall và ném lỗi bình thường khi isDemoMode() trả về false (không nuốt lỗi)', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);

    const apiError = new Error('HTTP 500 Network Error');
    const apiCall = vi.fn().mockRejectedValue(apiError);
    const demoCall = vi.fn().mockResolvedValue('from_demo');

    await expect(executeWithDemoMode(apiCall, demoCall)).rejects.toThrow('HTTP 500 Network Error');
    expect(apiCall).toHaveBeenCalled();
    expect(demoCall).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

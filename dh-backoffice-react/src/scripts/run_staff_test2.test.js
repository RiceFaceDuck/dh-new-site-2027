import { describe, it } from 'vitest';
import { gasHistoryService } from '../firebase/gasHistoryService';

describe('Staff Workflow Simulation 2', () => {
    it('should trigger BILLI log', async () => {
        gasHistoryService.setProfile({ firstName: 'AI', role: 'manager' });
        gasHistoryService.log({
            level: 'INFO',
            module: 'BILLI',
            action: 'CREATE_BILL',
            target: { id: 'DH-2026-07-0005', name: 'AI Technical Service' },
            details: { method: 'TEST', test: 'Real Situation Simulation' },
            actorOverride: { uid: 'NJplV50wBOX02lKTQclEJ5pgVws2', email: 'ai.manager@dhnotebook.com', name: 'ผู้จัดการ AI' }
        });
        await gasHistoryService._flush();
        console.log('✅ BILLI Log sent via GAS.');
    });
});

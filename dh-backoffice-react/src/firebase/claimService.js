import { claimRequestService } from './claim/claimRequestService';
import { claimManagerService } from './claim/claimManagerService';

export const claimService = {
  ...claimRequestService,
  ...claimManagerService
};
import { inventoryQueryService } from './inventory/inventoryQueryService';
import { inventoryMutationService } from './inventory/inventoryMutationService';
import { inventorySourcingService } from './inventory/inventorySourcingService';
import { inventoryImportService } from './inventory/inventoryImportService';
import { inventoryStatsService } from './inventory/inventoryStatsService';

export const inventoryService = {
  ...inventoryQueryService,
  ...inventoryMutationService,
  ...inventorySourcingService,
  ...inventoryImportService,
  ...inventoryStatsService
};
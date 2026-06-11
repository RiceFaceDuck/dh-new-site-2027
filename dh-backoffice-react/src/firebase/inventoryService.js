import { inventoryQueryService } from './inventory/inventoryQueryService';
import { inventoryMutationService } from './inventory/inventoryMutationService';
import { inventorySourcingService } from './inventory/inventorySourcingService';
import { inventoryImportService } from './inventory/inventoryImportService';

export const inventoryService = {
  ...inventoryQueryService,
  ...inventoryMutationService,
  ...inventorySourcingService,
  ...inventoryImportService
};
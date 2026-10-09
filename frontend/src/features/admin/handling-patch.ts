import type { HandlingFormValues } from '@/schemas/admin-request';
import type { AdminRequestUpdate, RequestDetails, RequestStatus } from '@/types/requests';

// RN-07 without the final step: resolving has its own confirmed action.
const NEXT_EDITABLE_STATUSES: Record<RequestStatus, readonly RequestStatus[]> = {
  OPEN: ['OPEN', 'IN_PROGRESS'],
  IN_PROGRESS: ['IN_PROGRESS'],
  RESOLVED: [],
};

export function editableStatuses(current: RequestStatus): readonly RequestStatus[] {
  return NEXT_EDITABLE_STATUSES[current];
}

export function toHandlingValues(request: RequestDetails): HandlingFormValues {
  return {
    priority: request.priority ?? '',
    status: request.status,
    adminNote: request.adminNote ?? '',
  };
}

// Only changed fields are sent, so concurrent edits of other fields are not overwritten.
export function buildHandlingPatch(
  request: RequestDetails,
  values: HandlingFormValues,
): AdminRequestUpdate {
  const patch: AdminRequestUpdate = {};
  if (values.priority && values.priority !== request.priority) patch.priority = values.priority;
  if (values.status !== request.status) patch.status = values.status;
  if (values.adminNote.trim() !== (request.adminNote ?? ''))
    patch.adminNote = values.adminNote.trim();
  return patch;
}

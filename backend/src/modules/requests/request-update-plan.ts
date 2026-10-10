import { BadRequestException, ConflictException } from '@nestjs/common';
import { Priority, PRIORITY_RANK } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';

export interface AdminRequestPatch {
  priority?: Priority;
  status?: RequestStatus;
  adminNote?: string;
  resolution?: string;
}

export interface RequestUpdate {
  priority?: Priority;
  priorityRank?: number;
  status?: RequestStatus;
  adminNote?: string | null;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export const EMPTY_PATCH_MESSAGE = 'Informe ao menos um campo para atualizar.';
export const RESOLVED_IS_FINAL_MESSAGE = 'Solicitação finalizada não pode ser alterada.';
export const INVALID_TRANSITION_MESSAGE = 'Transição de status não permitida.';
export const RESOLUTION_REQUIRED_MESSAGE = 'Informe a resolução para finalizar a solicitação.';
export const RESOLUTION_ONLY_ON_RESOLVE_MESSAGE =
  'A resolução só pode ser informada ao finalizar a solicitação.';

// RN-07: only IN_PROGRESS requests can be resolved; RESOLVED is final.
const ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  [RequestStatus.Open]: [RequestStatus.InProgress],
  [RequestStatus.InProgress]: [RequestStatus.Resolved],
  [RequestStatus.Resolved]: [],
};

function nextStatus(current: RequestStatus, requested?: RequestStatus): RequestStatus | undefined {
  if (requested === undefined || requested === current) return undefined;
  if (!ALLOWED_TRANSITIONS[current].includes(requested)) {
    throw new ConflictException(INVALID_TRANSITION_MESSAGE);
  }
  return requested;
}

function resolutionUpdate(
  resolution: string | undefined,
  { adminId, now }: { adminId: string; now: Date },
): RequestUpdate {
  const trimmed = resolution?.trim();
  if (!trimmed) throw new BadRequestException(RESOLUTION_REQUIRED_MESSAGE);
  return {
    status: RequestStatus.Resolved,
    resolution: trimmed,
    resolvedAt: now,
    resolvedBy: adminId,
  };
}

export function planRequestUpdate(
  currentStatus: RequestStatus,
  patch: AdminRequestPatch,
  context: { adminId: string; now: Date },
): RequestUpdate {
  if (Object.values(patch).every((value) => value === undefined)) {
    throw new BadRequestException(EMPTY_PATCH_MESSAGE);
  }
  if (currentStatus === RequestStatus.Resolved)
    throw new ConflictException(RESOLVED_IS_FINAL_MESSAGE);

  const status = nextStatus(currentStatus, patch.status);
  if (status !== RequestStatus.Resolved && patch.resolution !== undefined) {
    throw new BadRequestException(RESOLUTION_ONLY_ON_RESOLVE_MESSAGE);
  }

  const update: RequestUpdate =
    status === RequestStatus.Resolved
      ? resolutionUpdate(patch.resolution, context)
      : { ...(status && { status }) };
  if (patch.priority)
    Object.assign(update, {
      priority: patch.priority,
      priorityRank: PRIORITY_RANK[patch.priority],
    });
  if (patch.adminNote !== undefined) update.adminNote = patch.adminNote.trim() || null;
  return update;
}

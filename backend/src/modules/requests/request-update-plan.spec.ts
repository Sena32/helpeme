import { BadRequestException, ConflictException } from '@nestjs/common';
import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { planRequestUpdate } from './request-update-plan';

const ADMIN_ID = 'admin-id';
const NOW = new Date('2026-03-10T12:00:00.000Z');
const plan = (status: RequestStatus, patch: Parameters<typeof planRequestUpdate>[1]) =>
  planRequestUpdate(status, patch, { adminId: ADMIN_ID, now: NOW });

describe('planRequestUpdate', () => {
  it('AC-19: sets the priority and its numeric rank', () => {
    expect(plan(RequestStatus.Open, { priority: Priority.High })).toEqual({
      priority: Priority.High,
      priorityRank: 3,
    });
  });

  it('AC-20: moves OPEN to IN_PROGRESS with an admin note', () => {
    expect(
      plan(RequestStatus.Open, { status: RequestStatus.InProgress, adminNote: ' Verificando ' }),
    ).toEqual({ status: RequestStatus.InProgress, adminNote: 'Verificando' });
  });

  it('AC-21: refuses to resolve without a resolution (400)', () => {
    expect(() => plan(RequestStatus.InProgress, { status: RequestStatus.Resolved })).toThrow(
      BadRequestException,
    );
    expect(() =>
      plan(RequestStatus.InProgress, { status: RequestStatus.Resolved, resolution: '   ' }),
    ).toThrow(BadRequestException);
  });

  it('AC-22: resolves with resolution, resolvedAt and resolvedBy', () => {
    expect(
      plan(RequestStatus.InProgress, {
        status: RequestStatus.Resolved,
        resolution: 'Trocado o cabo.',
      }),
    ).toEqual({
      status: RequestStatus.Resolved,
      resolution: 'Trocado o cabo.',
      resolvedAt: NOW,
      resolvedBy: ADMIN_ID,
    });
  });

  it('AC-38: refuses to resolve directly from OPEN (409)', () => {
    expect(() =>
      plan(RequestStatus.Open, { status: RequestStatus.Resolved, resolution: 'Ok' }),
    ).toThrow(ConflictException);
  });

  it('AC-23: treats a RESOLVED request as final (409) for any change', () => {
    expect(() => plan(RequestStatus.Resolved, { status: RequestStatus.InProgress })).toThrow(
      ConflictException,
    );
    expect(() => plan(RequestStatus.Resolved, { priority: Priority.Low })).toThrow(
      ConflictException,
    );
    expect(() => plan(RequestStatus.Resolved, { adminNote: 'nota' })).toThrow(ConflictException);
  });

  it('RN-07: rejects moving back from IN_PROGRESS to OPEN (409)', () => {
    expect(() => plan(RequestStatus.InProgress, { status: RequestStatus.Open })).toThrow(
      ConflictException,
    );
  });

  it('keeps the current status when it is resent, so only the note changes', () => {
    expect(
      plan(RequestStatus.InProgress, {
        status: RequestStatus.InProgress,
        adminNote: 'Aguardando peça',
      }),
    ).toEqual({ adminNote: 'Aguardando peça' });
  });

  it('clears the admin note when sent empty', () => {
    expect(plan(RequestStatus.Open, { adminNote: '  ' })).toEqual({ adminNote: null });
  });

  it('rejects a resolution outside a resolution (400)', () => {
    expect(() => plan(RequestStatus.Open, { resolution: 'cedo demais' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an empty patch (400)', () => {
    expect(() => plan(RequestStatus.Open, {})).toThrow(BadRequestException);
  });
});

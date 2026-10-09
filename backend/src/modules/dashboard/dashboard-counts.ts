import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { UNSET_PRIORITY_FILTER } from '../requests/request-list-query';
import { PriorityCountKey } from './dashboard.types';

export interface GroupCount<Key> {
  _id: Key;
  count: number;
}

function zeroFilled<Key extends string>(keys: readonly Key[]): Record<Key, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>;
}

export function toStatusCounts(groups: GroupCount<RequestStatus>[]): Record<RequestStatus, number> {
  const counts = zeroFilled(Object.values(RequestStatus));
  for (const { _id, count } of groups) counts[_id] = count;
  return counts;
}

export function toPriorityCounts(
  groups: GroupCount<Priority | null>[],
): Record<PriorityCountKey, number> {
  const counts = zeroFilled<PriorityCountKey>([...Object.values(Priority), UNSET_PRIORITY_FILTER]);
  for (const { _id, count } of groups) counts[_id ?? UNSET_PRIORITY_FILTER] = count;
  return counts;
}

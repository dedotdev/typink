import { EventEmitter } from 'dedot/utils';

export type Callback = (events: any[]) => void;
export type Unsub = () => void;
export enum InternalEvent {
  SYSTEM_EVENTS = 'SYSTEM_EVENTS',
}

export const InternalEE = new EventEmitter<InternalEvent>();

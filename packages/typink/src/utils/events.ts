import { FrameSystemEventRecord } from 'dedot/chaintypes';
import { EventEmitter } from 'dedot/utils';

export type InternalCallback = {
  [InternalEvent.SYSTEM_EVENTS]: (events: FrameSystemEventRecord[]) => void;
};

export type Unsub = () => void;
export enum InternalEvent {
  SYSTEM_EVENTS = 'SYSTEM_EVENTS',
}

export const InternalEE = new EventEmitter<InternalEvent>();

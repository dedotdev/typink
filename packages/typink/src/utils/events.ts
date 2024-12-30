import { EventEmitter } from 'dedot/utils'
import type { FrameSystemEventRecord } from 'dedot/chaintypes';

export type SystemEventsListener = (events: FrameSystemEventRecord[]) => void;
export type Unsub = () => void;
export type HandlerFn = (...args: any[]) => void;
export enum InternalEvent {
  SystemEvents = 'SYSTEM_EVENTS',
}

export default new EventEmitter();



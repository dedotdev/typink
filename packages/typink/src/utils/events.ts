import { EventEmitter as EE } from 'eventemitter3';
import type { FrameSystemEventRecord } from 'dedot/chaintypes';

export type SystemEventsListener = (events: FrameSystemEventRecord[]) => void;
export type Unsub = () => void;
export type HandlerFn = (...args: any[]) => void;
export enum InternalEvent {
  SystemEvents = 'SYSTEM_EVENTS',
}

export interface IEventEmitter<EventTypes extends string = string> {
  on(event: EventTypes, handler: HandlerFn): Unsub;
  once(event: EventTypes, handler: HandlerFn): Unsub;
  off(event: EventTypes, handler?: HandlerFn): this;
  eventNames(): EventTypes[];
}

const handlerWrapper = (handler: HandlerFn): HandlerFn => {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch {
      // ignore this!
    }
  };
};

export class EventEmitter<EventTypes extends string = string> implements IEventEmitter<EventTypes> {
  #emitter: EE;
  #mapper: Map<HandlerFn, HandlerFn>;

  constructor() {
    this.#emitter = new EE();
    this.#mapper = new Map();
  }

  emit(event: EventTypes, ...args: any[]): boolean {
    return this.#emitter.emit(event, ...args);
  }

  protected clearEvents() {
    this.#emitter.removeAllListeners();
    this.#mapper.clear();
  }

  public on(event: EventTypes, handler: HandlerFn): Unsub {
    const wrapper = handlerWrapper(handler);
    this.#mapper.set(handler, wrapper);
    this.#emitter.on(event, wrapper);

    return () => {
      this.off(event, handler);
    };
  }

  public once(event: EventTypes, handler: HandlerFn): Unsub {
    const wrapper = handlerWrapper(handler);
    this.#mapper.set(handler, wrapper);

    this.#emitter.once(event, wrapper);

    return () => {
      this.off(event, handler);
    };
  }

  public off(event: EventTypes, handler?: HandlerFn): this {
    if (handler) {
      const wrapper = this.#mapper.get(handler);
      if (!wrapper) return this;

      this.#emitter.off(event, wrapper);
      this.#mapper.delete(handler);
    } else {
      this.#emitter.off(event);
    }

    return this;
  }

  public eventNames(): EventTypes[] {
    return this.#emitter.eventNames() as EventTypes[];
  }
}


export const InternalEE = new EventEmitter<InternalEvent>();

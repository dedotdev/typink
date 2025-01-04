import { act } from '@testing-library/react';
import { Props } from '../../types.js';
import { TypinkEventsProvider } from '../../providers/index.js';

export const waitForNextUpdate = async (then?: () => Promise<void>) => {
  await act(async () => {
    then && (await then());
    await sleep();
  });
};

export const sleep = (ms: number = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const typinkEventsWrapper = ({ children }: Props) => <TypinkEventsProvider>{children}</TypinkEventsProvider>;

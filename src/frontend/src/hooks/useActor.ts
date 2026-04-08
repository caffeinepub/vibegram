import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { Backend } from "../backend";

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _useActor(createActor as any) as {
    actor: Backend | null;
    isFetching: boolean;
  };
}

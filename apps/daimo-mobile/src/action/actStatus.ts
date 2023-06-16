import { useCallback, useState } from "react";

type ActStatus = "idle" | "loading" | "success" | "error";

export type SetActStatus = (
  status: ActStatus | Error,
  message?: string
) => void;

export interface ActHandle {
  /** Action status */
  status: ActStatus;
  /** Empty when idle. Describes progress, success, or failure. */
  message: string;
  /** Should be called only when status is 'idle' */
  exec: () => void;
}

/** Tracks progress of a user action. */
export function useActStatus() {
  const [as, set] = useState({ status: "idle" as ActStatus, message: "" });

  // TODO: track timing and reliability
  const setAS: SetActStatus = useCallback(
    (status: ActStatus | Error, message?: string) => {
      if (typeof status !== "string") {
        if (message == null) message = status.message;
        status = "error";
      }
      if (message == null) message = "";

      set({ status, message });
    },
    []
  );

  return [as, setAS] as const;
}
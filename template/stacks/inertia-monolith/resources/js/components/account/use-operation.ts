import { useState } from "react";
import { failure, type Fields } from "@/lib/auth/flows";

export function useOperation() {
  const [state, setState] = useState<{
    pending: boolean;
    error: string;
    fields: Fields;
    success: string;
  }>({ pending: false, error: "", fields: {}, success: "" });
  async function run(action: () => Promise<unknown>, success = "") {
    setState({ pending: true, error: "", fields: {}, success: "" });
    try {
      await action();
      setState({ pending: false, error: "", fields: {}, success });
    } catch (error) {
      const result = failure(error);
      setState({ pending: false, error: result.message, fields: result.fields, success: "" });
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('[role="dialog"] [data-feedback], [data-feedback]')
          ?.focus(),
      );
    }
  }
  return { ...state, run };
}

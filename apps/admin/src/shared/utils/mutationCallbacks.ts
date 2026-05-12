/**
 * Standard mutation callbacks for Refine mutations (context-aware)
 *
 * Uses App.useApp() to get a context-aware message instance.
 * Must be called inside a component wrapped by <AntApp>.
 *
 * Usage:
 * ```tsx
 * const { message } = App.useApp();
 * const { mutate: deleteOne } = useDelete();
 *
 * deleteOne(
 *   { resource: "couponTemplate", id: "123" },
 *   createMutationCallbacks("删除", query, message)
 * );
 * ```
 */

import type { MessageInstance } from "antd/es/message/interface";

/**
 * Create standard mutation callbacks with success/error notifications
 */
export function createMutationCallbacks(
  actionName: string,
  query?: { refetch: () => void },
  onSuccessCallback?: () => void,
  messageApi?: MessageInstance
) {
  const msg = messageApi || { success: console.log, error: console.error };

  return {
    onSuccess: () => {
      msg.success(`${actionName}成功`);
      onSuccessCallback?.();
      query?.refetch();
    },
    onError: (error: any) => {
      console.error(`${actionName}失败:`, error);
      query?.refetch();
    },
  };
}

/**
 * Create batch mutation callbacks
 */
export function createBatchMutationCallbacks(
  actionName: string,
  count: number,
  query?: { refetch: () => void },
  clearSelection?: () => void,
  messageApi?: MessageInstance
) {
  const msg = messageApi || { success: console.log, error: console.error };

  return {
    onSuccess: () => {
      msg.success(`成功${actionName} ${count} 项`);
      clearSelection?.();
      query?.refetch();
    },
    onError: (error: any) => {
      console.error(`${actionName}失败:`, error);
      clearSelection?.();
      query?.refetch();
    },
  };
}

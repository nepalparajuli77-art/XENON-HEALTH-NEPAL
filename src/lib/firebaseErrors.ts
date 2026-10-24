export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'list';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string;
  authInfo: {
    userId?: string;
    email?: string;
    isAnonymous?: boolean;
  };
}

/**
 * Generic Firestore error handler that throws a structured FirestoreErrorInfo object.
 */
export function handleFirestoreError(
  error: unknown,
  operationContext: {
    operationType: OperationType;
    path: string;
    authInfo: {
      userId?: string;
      email?: string;
      isAnonymous?: boolean;
    };
  }
): never {
  const err = error as { code?: string; message?: string };
  const errorInfo: FirestoreErrorInfo = {
    error: err?.message || String(error),
    authInfo: operationContext.authInfo,
    operationType: operationContext.operationType,
    path: operationContext.path,
  };
  throw new Error(JSON.stringify(errorInfo));
}

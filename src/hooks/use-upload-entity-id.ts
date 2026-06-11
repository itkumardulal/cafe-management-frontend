"use client";

import { useCallback, useState } from "react";

export function useUploadEntityId(initialId = "") {
  const [entityId, setEntityId] = useState(initialId);

  const resetForCreate = useCallback(() => {
    setEntityId(crypto.randomUUID());
  }, []);

  const setForEdit = useCallback((id: string) => {
    setEntityId(id);
  }, []);

  return {
    entityId,
    setEntityId,
    resetForCreate,
    setForEdit,
  };
}

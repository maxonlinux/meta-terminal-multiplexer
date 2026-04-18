import { useState } from "react";
import { EditableStage } from "../types/editor.types";
import { UUID } from "crypto";

export const useStages = () => {
  const [stages, setStages] = useState<EditableStage[]>([]);

  const addStage = () => {
    const stage = {
      id: crypto.randomUUID() as UUID,
      type: null,
    } satisfies EditableStage;

    setStages((prev) => [...prev, stage]);
  };

  const updateStage = (id: UUID, stage: EditableStage) => {
    setStages((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      next[index] = stage;
      return next;
    });
  };

  const removeStage = (id: UUID) => {
    setStages((prev) => prev.filter((stage) => stage.id !== id));
  };

  return {
    stages,
    addStage,
    updateStage,
    removeStage,
  };
};

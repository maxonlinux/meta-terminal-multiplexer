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

    setStages((prev: any) => [...prev, stage]);
  };

  const updateStage = (id: UUID, stage: EditableStage) => {
    setStages((prev: any) => {
      const index = prev.findIndex((stage: any) => stage.id === id);
      prev[index] = stage;
      return [...prev];
    });
  };

  const removeStage = (id: UUID) => {
    setStages((prev: any) => prev.filter((stage: any) => stage.id !== id));
  };

  return {
    stages,
    addStage,
    updateStage,
    removeStage,
  };
};

import { UUID } from "crypto";
import { Stage } from "./simulations.types";

type EmptyStage = {
  id: UUID;
  type: null;
};

export type EditableStage = EmptyStage | Stage;

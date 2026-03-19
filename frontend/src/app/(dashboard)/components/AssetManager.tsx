"use client";

import { SimulationBuilderList } from "./builder/SimulationBuilderList";
import { SimulationsList } from "./simulations/SimulationsList";

export const AssetManager = () => {
  return (
    <div className="h-full min-h-0 grid grid-cols-2 max-sm:grid-cols-1 max-sm:grid-rows-2 px-2 gap-2">
      <SimulationBuilderList />
      <SimulationsList />
    </div>
  );
};

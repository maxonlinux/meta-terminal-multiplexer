import useSWR from "swr";
import { api } from "@/shared/axios/api";
import { Simulation } from "../types/simulations.types";
import { UUID } from "crypto";
import { EditableStage } from "../types/editor.types";

export const useSimulations = () => {
  const { data, isLoading, error, mutate } = useSWR<Simulation[]>(
    "/api/proxy/multiplexer/admin/simulations",
    async (url: string) => {
      const { data } = await api.get<Simulation[]>(url);
      return data;
    },
    {
      refreshInterval: 1000,
    },
  );

  const createSimulation = async (
    symbol: string,
    isoDateTime: string | null,
    stages: EditableStage[],
  ) => {
    await api.post("/api/proxy/multiplexer/admin/simulations", {
      symbol: symbol,
      stages: stages,
      startTime: isoDateTime,
    });

    await mutate();
  };

  const rescheduleSimulation = async (
    simulationId: UUID,
    isoDateTime: string | null,
  ) => {
    await api.patch(
      `/api/proxy/multiplexer/admin/simulations/reschedule/${simulationId}`,
      { startTime: isoDateTime },
    );

    await mutate();
  };

  const deleteSimulation = async (simulationId: UUID) => {
    await api.delete(
      `/api/proxy/multiplexer/admin/simulations/${simulationId}`,
    );

    await mutate();
  };

  const abortSimulation = async (simulationId: UUID) => {
    await api.patch(
      `/api/proxy/multiplexer/admin/simulations/abort/${simulationId}`,
    );

    await mutate();
  };

  return {
    revalidate: mutate,
    createSimulation,
    rescheduleSimulation,
    deleteSimulation,
    abortSimulation,
    simulations: data,
    isLoading,
    error,
  };
};

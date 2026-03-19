import { IconSkeleton } from "@/shared/components/IconSkeleton";
import { Skeleton } from "@/shared/components/Skeleton";
import { cls } from "@/shared/utils";
import { ClockFading, GripVertical, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScenarioStatus, Simulation } from "../../types/simulations.types";
import { CancelSimulation } from "./CancelSimulation";
import { RescheduleSimulation } from "./RescheduleSimulation";
import { StageItem } from "./StageItem";
import { DeleteSimulation } from "./DeleteSimulation";

const getCurrentStageIndex = (simulation: Simulation) => {
  if (!simulation.period) {
    return -1;
  }

  let remaining = simulation.period.tick_count;

  for (let i = 0; i < simulation.stages.length; i++) {
    const stage = simulation.stages[i];
    remaining -= stage.duration;

    if (remaining < 0) {
      return i;
    }
  }

  // More than last index so it means all the stages passed
  return simulation.stages.length;
};

const Progress = ({
  current_step,
  total_steps,
}: {
  current_step: number;
  total_steps: number;
}) => {
  return (
    <div className="w-full h-1 bg-accent/20 overflow-hidden rounded-full">
      <div
        className="h-full bg-accent transition-all"
        style={{
          width: (current_step / total_steps) * 100 + "%",
        }}
      />
    </div>
  );
};

export const SimulationItem = ({
  simulation,
  className,
}: {
  simulation: Simulation;
  className?: string;
}) => {
  const currentStageIndex = getCurrentStageIndex(simulation);

  const isActive = simulation.status === ScenarioStatus.ACTIVE;
  const isScheduled = simulation.status === ScenarioStatus.SCHEDULED;
  const isDone = simulation.status === ScenarioStatus.DONE;
  const isCancelled = simulation.status === ScenarioStatus.CANCELLED;

  return (
    <div
      className={cls(
        "relative flex items-center gap-4 w-full select-none rounded-sm border bg-background touch-none",
        isActive ? "border-accent" : "border-white/5",
        className
      )}
    >
      <div className="grid grid-cols-[auto_1fr] w-full divide-y divide-white/5">
        <div className="col-span-2 flex items-center justify-between w-full p-2">
          <div className="flex items-center gap-2">
            {isActive && (
              <Loader2 size={16} className="animate-spin text-accent" />
            )}
            {isScheduled && (
              <ClockFading size={16} className="text-current/50" />
            )}
            {isDone && <History size={16} className="text-current/50" />}
            {simulation.symbol}
          </div>

          <div className="col-span-2 text-xs text-current/50">
            {format(new Date(simulation.startTime), "MM/dd/yyyy HH:mm")}
          </div>
        </div>

        <div className="col-span-2 text-xs px-2 py-1">
          <div className="flex items-center gap-2">
            Status:
            <span className="text-current/50">{simulation.status}</span>
          </div>
        </div>

        {!isDone && simulation.period && (
          <div className="col-span-2 text-xs p-2">
            <div className="flex items-center gap-2">
              Progress:
              <span className="text-current/50">
                {simulation.period.tick_count}/{simulation.totalSteps}
              </span>
              <Progress
                current_step={simulation.period.tick_count}
                total_steps={simulation.totalSteps}
              />
            </div>
          </div>
        )}

        <div className="col-span-2 text-xs">
          <table className="border-collapse w-full">
            <tbody className="divide-y divide-white/5">
              {simulation.stages.map((stage, i) => (
                <StageItem
                  key={i}
                  index={i}
                  stage={stage}
                  currentStageIndex={currentStageIndex}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 p-2">
          {isScheduled && (
            <>
              <DeleteSimulation simulationId={simulation.scenarioId} />
              <RescheduleSimulation simulationId={simulation.scenarioId} />
            </>
          )}
          {isActive && (
            <>
              <CancelSimulation simulationId={simulation.scenarioId} />
            </>
          )}
          {(isDone || isCancelled) && (
            <>
              <DeleteSimulation simulationId={simulation.scenarioId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const SimulationSkeleton = () => (
  <div className="relative flex gap-2 border border-white/5 bg-background rounded-sm p-2">
    <div className="flex items-center justify-center cursor-grab  select-none">
      <IconSkeleton icon={GripVertical} className="w-4 h-4" />
    </div>
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <Skeleton className="col-start-1 h-3 w-40 rounded-sm" />
      <Skeleton className="col-start-2 h-3 w-28 rounded-sm" />
      <Skeleton className="col-span-2 h-3 w-30 rounded-sm" />
    </div>
  </div>
);

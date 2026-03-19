import {
  ChevronRight,
  Clock,
  Target,
  Activity,
  Check,
  ArrowRight,
  Dot,
} from "lucide-react";
import { Stage, StageType } from "../../types/simulations.types";
import { cls } from "@/shared/utils";

const stageMap = {
  [StageType.TO_TARGET]: "To target",
  [StageType.FLAT]: "Flat",
  [StageType.REVERT]: "Revert",
};

export const StageItem = ({
  index,
  stage,
  currentStageIndex,
}: {
  index: number;
  stage: Stage;
  currentStageIndex: number;
}) => {
  const isCurrent = index === currentStageIndex;
  const isPast = index < currentStageIndex;
  const isFuture = index > currentStageIndex;

  return (
    <tr
      className={cls(
        "[&>*]:py-1 [&>*]:px-2",
        isCurrent ? "bg-white/5" : "text-current/50"
      )}
    >
      {/* <td className={cls("w-0 text-nowrap border-r border-white/5")}>
        {isCurrent && <ChevronRight size={12} />}
        {isPast && <div className="w-3" />}
        {isFuture && <div className="w-3" />}
      </td> */}

      <td className={cls("w-0 text-nowrap border-r border-white/5")}>
        {stageMap[stage.type]}
      </td>

      <td className="flex items-center gap-2">
        <div className="flex gap-2 items-center">
          <span className="text-current/50">
            <Clock size={12} />
          </span>{" "}
          {stage.duration}
        </div>

        {stage.type === StageType.TO_TARGET && (
          <div className="flex gap-2 items-center">
            <span className="text-current/50">
              <Target size={12} />
            </span>{" "}
            {stage.target}
          </div>
        )}

        {stage.type === StageType.FLAT && (
          <div className="flex gap-2 items-center">
            <span className="text-current/50">
              <Activity size={12} />
            </span>{" "}
            {stage.range}
          </div>
        )}
      </td>
    </tr>
  );
};

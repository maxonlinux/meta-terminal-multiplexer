import { Skeleton } from "@/shared/components/Skeleton";
import { cls, getIsoDate } from "@/shared/utils";
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Loader,
  Plus,
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  DateInput,
  DateSegment,
  Disclosure,
  DisclosurePanel,
  Label,
  TimeField,
  DateField,
  I18nProvider,
  Checkbox,
} from "react-aria-components";
import toast from "react-hot-toast";
import { AssetData } from "@/shared/types";
import { useStages } from "../../hooks/useStages";
import { EditableStageItem } from "./EditableStageItem";
import {
  CalendarDate,
  Time,
} from "@internationalized/date";
import { StageType } from "../../types/simulations.types";
import { useSimulations } from "../../hooks/useSimulations";
import { isAxiosError } from "axios";
import { API_BASE } from "@/shared/axios/api";

export const SimulationBuilder = ({
  asset,
  pending,
}: {
  asset: Omit<AssetData, "tick_size">;
  pending?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRunImmediately, setShouldRunImmediately] = useState(true);

  const [date, setDate] = useState<CalendarDate | null>(null);
  const [time, setTime] = useState<Time | null>(null);

  const { stages, addStage, removeStage, updateStage } = useStages();
  const { createSimulation } = useSimulations();

  const handleRun = async () => {
    setIsLoading(true);

    try {
      if (!stages.length) {
        toast.error("Please add at least one stage");
        setIsLoading(false);
        return;
      }

      if (stages[stages.length - 1].type !== StageType.REVERT) {
        toast.error("Stage sequence must end with REVERT stage");
        setIsLoading(false);
        return;
      }

      if (!shouldRunImmediately && (!date || !time)) {
        toast.error("Please select a date and time or check 'Instant'");
        setIsLoading(false);
        return;
      }

      toast.loading("Creating simulation...");

      const dateTime = getIsoDate(date, time);

      await createSimulation(asset.symbol, dateTime, stages);

      toast.remove();
      toast.success("Simulation created!");
    } catch (e) {
      toast.remove();
      const fallbackErrMsg = "Simulation failed";

      if (isAxiosError(e)) {
        toast.error(e.response?.data.error ?? fallbackErrMsg);
        return;
      }

      toast.error(fallbackErrMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-white/5 bg-background rounded-sm">
      <Disclosure isExpanded={isExpanded}>
        <div className="relative flex gap-2 p-2">
          <div className="size-8 bg-neutral-800 rounded-xs overflow-hidden">
            <img
              className="size-full"
              src={`${API_BASE}/proxy/core/storage/${asset.image_url}`}
              alt={`${asset.symbol} Logo`}
            />
          </div>
          <div
            className={cls("grid grid-cols-[auto_1fr] gap-x-2", {
              "animate-pulse": !!pending,
            })}
          >
            <div className="col-start-1 text-xs">
              {asset.symbol}:{asset.exchange}
            </div>
            <div className="col-start-2 text-xs text-current/50 rounded-xs">
              {asset.type}
            </div>
            <div className="col-span-2 text-xs opacity-50">
              {asset.description}
            </div>
          </div>
          <div className="absolute group right-0 m-1 inset-y-0">
            <div className="size-full aspect-square flex items-center justify-center">
              <Button
                className={cls("p-1.5 cursor-pointer rounded-xs size-full")}
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                <Plus
                  size={14}
                  className={cls(
                    "group-hover:text-accent m-auto transition-transform",
                    {
                      "rotate-45": isExpanded,
                    }
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
        <DisclosurePanel>
          <div className="[&>div]:border-t [&>div]:border-white/5">
            <div className="flex flex-col gap-2 p-2">
              <div className="text-xs text-current/50">Schedule</div>

              <div className="flex gap-2">
                <div
                  className={cls(
                    "flex items-center text-sm border border-white/10 p-1 rounded-sm",
                    { "bg-neutral-900 opacity-50": shouldRunImmediately }
                  )}
                >
                  <Calendar size={12} className="mx-1" />
                  <I18nProvider locale="en-GB">
                    <DateField
                      value={date}
                      onChange={setDate}
                      isDisabled={shouldRunImmediately}
                      aria-label="Date input"
                    >
                      <DateInput className="space-x-0.5">
                        {(segment) => (
                          <DateSegment
                            className="data-placeholder:text-current/50 px-1 py-px rounded-xs border border-transparent focus:border-white focus:outline-0 focus:data-placeholder:text-white"
                            segment={segment}
                          />
                        )}
                      </DateInput>
                    </DateField>
                  </I18nProvider>
                </div>

                <div
                  className={cls(
                    "flex items-center text-sm border border-white/10 p-1 rounded-sm",
                    { "bg-neutral-900 opacity-50": shouldRunImmediately }
                  )}
                >
                  <Clock size={12} className="mx-1" />
                  <TimeField
                    value={time}
                    onChange={setTime}
                    hourCycle={24}
                    aria-label="Time input"
                    isDisabled={shouldRunImmediately}
                  >
                    <DateInput className="space-x-0.5">
                      {(segment) => (
                        <DateSegment
                          className="data-placeholder:text-current/50 px-1 py-px rounded-xs border border-transparent focus:border-white focus:outline-0 focus:data-placeholder:text-white data-[type='literal']:p-0 data-[type='literal']:border-none"
                          segment={segment}
                        />
                      )}
                    </DateInput>
                  </TimeField>
                </div>
              </div>

              <div className="w-fit">
                <Checkbox
                  isSelected={shouldRunImmediately}
                  onChange={setShouldRunImmediately}
                  className="group cursor-pointer flex items-center gap-2"
                >
                  {({ isSelected }) => (
                    <>
                      <div className="size-5 border border-border rounded-sm group-focus:border-white shrink-0">
                        <div className="flex items-center justify-center size-full">
                          <Check
                            size={14}
                            className={cls({ hidden: !isSelected })}
                          />
                        </div>
                      </div>
                      <Label className="text-xs text-current/50">Instant</Label>
                    </>
                  )}
                </Checkbox>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-current/50">Stages</div>
                <Button
                  className="flex gap-1 items-center p-2 rounded-sm cursor-pointer hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
                  onClick={() => addStage()}
                >
                  <Plus size={12} />
                  <span className="text-xs text-nowrap">ADD</span>
                </Button>
              </div>

              {stages.map((stage) => (
                <EditableStageItem
                  key={stage.id}
                  stage={stage}
                  onDelete={removeStage}
                  onUpdate={updateStage}
                />
              ))}
            </div>

            <div className="flex gap-2 p-2">
              <Button
                className={cls(
                  "flex gap-2 items-center justify-between w-full px-2 py-1 bg-accent/20 text-accent rounded-sm cursor-pointer hover:pr-1 hover:text-accent transition-all",
                  "disabled:opacity-20 disabled:bg-white/20 disabled:text-white disabled:pointer-events-none"
                )}
                isDisabled={!stages.length || isLoading}
                onClick={() => handleRun()}
              >
                {!isLoading ? (
                  <>
                    <span className="text-sm">CREATE</span>
                    <ChevronRight size={14} />
                  </>
                ) : (
                  <>
                    <span className="text-sm">LOADING...</span>
                    <Loader size={14} className="animate-spin" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};

export const SimulationBuilderSkeleton = () => (
  <div className="relative flex gap-2 border border-white/5 bg-background rounded-sm p-2">
    <Skeleton className="size-8 rounded-sm" />
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <Skeleton className="col-start-1 h-3 w-40 rounded-sm" />
      <Skeleton className="col-start-2 h-3 w-28 rounded-sm" />
      <Skeleton className="col-span-2 h-3 w-30 rounded-sm" />
    </div>
  </div>
);

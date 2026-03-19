import { Calendar, CalendarSync, Check, Clock, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  Button,
  Checkbox,
  DateField,
  DateInput,
  DateSegment,
  I18nProvider,
  Label,
  TimeField,
} from "react-aria-components";
import { useClickAnyWhere } from "usehooks-ts";
import { AnimatePresence, motion } from "motion/react";
import { cls, getIsoDate } from "@/shared/utils";
import { CalendarDate, Time } from "@internationalized/date";
import { useSimulations } from "../../hooks/useSimulations";
import { UUID } from "crypto";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

const Content = ({
  onClose,
  simulationId,
}: {
  onClose: () => void;
  simulationId: UUID;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [shouldRunImmediately, setShouldRunImmediately] = useState(true);

  const { rescheduleSimulation } = useSimulations();

  const [date, setDate] = useState<CalendarDate | null>(null);
  const [time, setTime] = useState<Time | null>(null);

  useClickAnyWhere((event: MouseEvent) => {
    if (ref.current?.contains(event.target as Node)) return;
    onClose();
  });

  const handleReschedule = async () => {
    try {
      if (!shouldRunImmediately && (!date || !time)) {
        toast.error("Please select a date and time or check 'Instant'");
        return;
      }

      const dateTime = getIsoDate(date, time);

      console.log(dateTime);

      await rescheduleSimulation(simulationId, dateTime);
    } catch (error) {
      const fallbackErrMsg = "Failed to reschedule";

      if (isAxiosError(error)) {
        toast.error(error.response?.data.error ?? fallbackErrMsg);
        return;
      }

      toast.error(fallbackErrMsg);
    } finally {
      onClose();
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col gap-2 items-center justify-center backdrop-blur-2xl bg-black/20"
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div
            className={cls(
              "flex items-center text-sm border border-white/10 p-1 rounded-sm bg-black",
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
              "flex items-center text-sm border border-white/10 p-1 rounded-sm bg-black",
              { "bg-neutral-900 opacity-50": shouldRunImmediately }
            )}
          >
            <Clock size={12} className="mx-1" />
            <TimeField
              value={time}
              onChange={setTime}
              hourCycle={24}
              isDisabled={shouldRunImmediately}
              aria-label="Time input"
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
        <div className="flex items-center justify-between">
          <Button
            onClick={handleReschedule}
            className="flex items-center gap-2 text-sm px-2 py-0.5 bg-accent/20 text-accent rounded-full cursor-pointer"
          >
            <Check size={12} /> Click to confirm
          </Button>

          <Checkbox
            isSelected={shouldRunImmediately}
            onChange={setShouldRunImmediately}
            className="group cursor-pointer flex items-center gap-2 bg-black"
          >
            {({ isSelected }) => (
              <>
                <Label className="text-xs text-current/50">Instant</Label>
                <div className="size-5 border border-border rounded-sm group-focus:border-white shrink-0">
                  <div className="flex items-center justify-center size-full">
                    <Check size={14} className={cls({ hidden: !isSelected })} />
                  </div>
                </div>
              </>
            )}
          </Checkbox>
        </div>
      </div>
    </motion.div>
  );
};

export const RescheduleSimulation = ({
  simulationId,
}: {
  simulationId: UUID;
}) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-sm cursor-pointer"
      >
        <CalendarSync size={12} /> Reschedule
      </Button>
      <AnimatePresence>
        {open && <Content simulationId={simulationId} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};

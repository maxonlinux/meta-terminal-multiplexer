"use client";

import { ArrowRight, Check, Funnel, Pickaxe, X } from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  Input,
  Label,
  Popover,
  TextField,
} from "react-aria-components";
import { useState } from "react";
import { WithSkeleton } from "@/shared/components/WithSkeleton";
import { SimulationSkeleton, SimulationItem } from "./SimulationItem";
import { useSimulations } from "../../hooks/useSimulations";
import { ContentContainer } from "../ContentContainer";
import { cls } from "@/shared/utils";
import { ScenarioStatus } from "../../types/simulations.types";

const FilterMap = {
  RUNNING: "RUNNING",
  SCHEDULED: "SCHEDULED",
  HISTORY: "HISTORY",
} as const;

const defaultFilterState = {
  [FilterMap.RUNNING]: true,
  [FilterMap.SCHEDULED]: true,
  [FilterMap.HISTORY]: true,
};

const LoadingState = () => (
  <div className="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2">
    {Array.from({ length: 2 }).map((_, i) => (
      <SimulationSkeleton key={i} />
    ))}
  </div>
);

const FilterCheckbox = ({
  value,
  setValue,
  label,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
  label: string;
}) => {
  return (
    <Checkbox
      className="group cursor-pointer flex items-center gap-2"
      isSelected={value}
      onChange={(val) => setValue(val)}
    >
      {({ isSelected }) => (
        <>
          <div className="size-5 border border-border rounded-sm group-focus:border-white shrink-0">
            <div className="flex items-center justify-center size-full">
              <Check size={14} className={cls({ hidden: !isSelected })} />
            </div>
          </div>
          <Label className="text-xs">{label}</Label>
        </>
      )}
    </Checkbox>
  );
};

export const SimulationsList = () => {
  const [search, setSearch] = useState("");

  const [filters, setFilters] =
    useState<Record<keyof typeof FilterMap, boolean>>(defaultFilterState);

  const handleFilter = (status: keyof typeof FilterMap) => {
    setFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleResetFilters = () => setFilters(defaultFilterState);

  const { simulations } = useSimulations();

  const filtersChanged =
    JSON.stringify(filters) !== JSON.stringify(defaultFilterState);

  const running =
    simulations?.filter((s) => s.status === ScenarioStatus.ACTIVE) ?? [];

  const scheduled =
    simulations?.filter((s) => s.status === ScenarioStatus.SCHEDULED) ?? [];

  const history =
    simulations?.filter(
      (s) =>
        s.status === ScenarioStatus.DONE ||
        s.status === ScenarioStatus.CANCELLED
    ) ?? [];

  const filtered = [
    ...(filters.RUNNING ? running : []),
    ...(filters.SCHEDULED ? scheduled : []),
    ...(filters.HISTORY ? history : []),
  ].filter(
    (s) =>
      s.symbol.toLocaleLowerCase().includes(search.toLowerCase()) ||
      s.status.toLocaleLowerCase().includes(search.toLowerCase())
  );

  return (
    <ContentContainer>
      <div className="flex flex-col h-full w-full">
        <div className="p-2">
          <p className="flex items-center gap-2 mb-2 py-2">
            <Pickaxe size={16} /> Simulations
          </p>
          <div className="flex items-center gap-2">
            <TextField
              aria-label="Search by symbol or status"
              className="relative w-full flex items-center rounded-sm border border-white/10 appearance-none"
              onChange={setSearch}
            >
              <Input
                placeholder="Search by symbol or status"
                aria-label="Simulation search input"
                className="w-full text-white p-2 rounded-xs data-focused:ring data-focused:outline-none data-focused:ring-white placeholder:text-sm"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />

              {/* {isLoading && (
              <Loader className="absolute right-3 size-3 animate-spin" />
            )} */}
            </TextField>

            <DialogTrigger>
              <Button className="flex items-center justify-center border border-white/10 aspect-square h-10 shrink-0 rounded-sm">
                <Funnel size={14} />
              </Button>

              <Popover placement="left" crossOffset={42}>
                <Dialog className="bg-neutral-900 border border-white/10 p-4 rounded-sm">
                  <div className="flex flex-col gap-4">
                    <FilterCheckbox
                      value={filters.RUNNING}
                      setValue={() => handleFilter(FilterMap.RUNNING)}
                      label="Show running"
                    />
                    <FilterCheckbox
                      value={filters.SCHEDULED}
                      setValue={() => handleFilter(FilterMap.SCHEDULED)}
                      label="Show scheduled"
                    />
                    <FilterCheckbox
                      value={filters.HISTORY}
                      setValue={() => handleFilter(FilterMap.HISTORY)}
                      label="Show history"
                    />
                  </div>
                </Dialog>
              </Popover>
            </DialogTrigger>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2">
          <WithSkeleton data={{ filtered }} skeleton={<LoadingState />}>
            {({ filtered }) => (
              <div
                className="flex flex-col gap-2 text-white"
                aria-label="Scheduled sims"
              >
                {/* <p className="flex items-center gap-2 text-sm text-current/50">
                    <ClockFading size={12} />
                    Scheduled
                  </p> */}

                {filtered.map((item) => (
                  <SimulationItem simulation={item} key={item.scenarioId} />
                ))}
                {!filtered.length && (
                  <div className="text-sm text-current/50">
                    <p>Nothing found</p>
                    {filtersChanged && (
                      <Button
                        className="flex items-center gap-1 cursor-pointer text-accent"
                        onClick={handleResetFilters}
                      >
                        <span className="text-sm">Reset filters</span>
                        <ArrowRight size={12} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </WithSkeleton>
        </div>
      </div>
    </ContentContainer>
  );
};

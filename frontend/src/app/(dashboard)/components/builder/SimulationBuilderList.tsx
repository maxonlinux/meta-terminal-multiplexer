"use client";

import { Hammer, Loader } from "lucide-react";
import { Input, TextField } from "react-aria-components";
import { useAssets } from "@/app/(dashboard)/hooks/useAssets";
import { useState } from "react";
import { ContentContainer } from "../ContentContainer";
import { WithSkeleton } from "@/shared/components/WithSkeleton";
import {
  SimulationBuilder,
  SimulationBuilderSkeleton,
} from "./SimulationBuilder";

const LoadingStage = () => (
  <div className="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <SimulationBuilderSkeleton key={i} />
    ))}
  </div>
);

export const SimulationBuilderList = () => {
  const { assets, isLoading } = useAssets();
  const [search, setSearch] = useState("");

  const filtered = assets
    ? assets.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.exchange.toLowerCase().includes(search.toLowerCase()) ||
          asset.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <ContentContainer className="relative overflow-hidden">
      <div className="flex flex-col h-full w-full">
        <div className="p-2">
          <p className="flex items-center gap-2 mb-2 py-2">
            <Hammer size={16} /> Create Simulation
          </p>
          <TextField
            aria-label="Search assets"
            className="relative w-full flex items-center rounded-sm border border-white/10 appearance-none"
            onChange={setSearch}
          >
            <Input
              placeholder="Search asset"
              aria-label="Asset search input"
              className="w-full text-white p-2 rounded-xs data-focused:ring data-focused:outline-none data-focused:ring-white placeholder:text-sm"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />

            {search && isLoading && (
              <Loader className="absolute right-3 size-3 animate-spin" />
            )}
          </TextField>
        </div>
        <div
          className="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2"
          aria-label="Asset list"
        >
          <WithSkeleton
            data={{ filtered: isLoading ? undefined : filtered }}
            skeleton={<LoadingStage />}
          >
            {({ filtered }) =>
              filtered.map((asset) => (
                <SimulationBuilder
                  asset={asset}
                  key={asset.symbol + asset.exchange}
                />
              ))
            }
          </WithSkeleton>
        </div>
      </div>
    </ContentContainer>
  );
};

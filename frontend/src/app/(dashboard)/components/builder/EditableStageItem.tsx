import { CustomSelect } from "@/shared/components/CustomSelect";
import { StageType } from "@/app/(dashboard)/types/simulations.types";
import { Target, Hourglass, Activity, Trash2 } from "lucide-react";
import {
  ListBoxItem,
  Button,
  NumberField,
  Input,
  Key,
} from "react-aria-components";
import { EditableStage } from "../../types/editor.types";
import { UUID } from "crypto";

const stageOptions = [
  {
    name: "To target",
    value: StageType.TO_TARGET,
  },
  {
    name: "Flat",
    value: StageType.FLAT,
  },
  {
    name: "Revert",
    value: StageType.REVERT,
  },
] as const;

const StageInput = ({
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ElementType;
  value: number;
  onChange: (val: number) => void;
  placeholder: string;
}) => {
  return (
    <div className="mt-2">
      <NumberField
        value={value}
        onChange={(val) => onChange(val)}
        className="relative flex items-center"
        aria-label="Stage input"
      >
        <Icon size={14} className="absolute mx-2" />
        <Input
          placeholder={placeholder}
          className="w-full bg-transparent border border-white/5 rounded-sm p-2 text-xs pl-8"
        />
      </NumberField>
    </div>
  );
};

const StageContent = ({
  stage,
  onChange,
}: {
  stage: EditableStage;
  onChange: (id: UUID, stage: EditableStage) => void;
}) => {
  if (stage.type === StageType.TO_TARGET) {
    return (
      <>
        <StageInput
          icon={Target}
          value={stage.target}
          onChange={(val) => onChange(stage.id, { ...stage, target: val })}
          placeholder="Enter target price"
        />
        <StageInput
          icon={Hourglass}
          value={stage.duration}
          onChange={(val) => onChange(stage.id, { ...stage, duration: val })}
          placeholder="Enter time in seconds"
        />
      </>
    );
  }

  if (stage.type === StageType.FLAT) {
    return (
      <>
        <StageInput
          icon={Activity}
          value={stage.range}
          onChange={(val) => onChange(stage.id, { ...stage, range: val })}
          placeholder="Enter range"
        />
        <StageInput
          icon={Hourglass}
          value={stage.duration}
          onChange={(val) => onChange(stage.id, { ...stage, duration: val })}
          placeholder="Enter time in seconds"
        />
      </>
    );
  }

  if (stage.type === StageType.REVERT) {
    return (
      <>
        <StageInput
          icon={Hourglass}
          value={stage.duration}
          onChange={(val) => onChange(stage.id, { ...stage, duration: val })}
          placeholder="Enter time in seconds"
        />
      </>
    );
  }
};

export const EditableStageItem = ({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: EditableStage;
  onUpdate: (id: UUID, stage: EditableStage) => void;
  onDelete: (id: UUID) => void;
}) => {
  const handleTypeChange = (key: Key | null) => {
    const type = key as StageType;
    const base = { id: stage.id };

    const defaultStage: EditableStage | null =
      type === StageType.TO_TARGET
        ? { ...base, type, target: NaN, duration: NaN }
        : type === StageType.FLAT
        ? { ...base, type, range: NaN, duration: NaN }
        : type === StageType.REVERT
        ? { ...base, type, duration: NaN }
        : null;

    if (!defaultStage) {
      return;
    }

    onUpdate(stage.id, defaultStage);
  };

  return (
    <div className="relative border border-white/5 p-2 rounded-sm">
      <div className="flex items-center w-0 gap-2">
        <CustomSelect
          selectProps={{
            selectedKey: stage.type,
            onSelectionChange: handleTypeChange,
            "aria-label": "Stage type select",
          }}
          items={stageOptions}
        >
          {(item) => (
            <ListBoxItem
              key={item.value}
              id={item.value}
              textValue={item.value}
              className="p-2 text-xs focus:bg-neutral-900 focus:cursor-pointer focus:text-white"
            >
              <div>{item.name}</div>
            </ListBoxItem>
          )}
        </CustomSelect>

        <Button
          className="group absolute right-0 p-1.5 cursor-pointer rounded-xs"
          onClick={() => onDelete(stage.id)}
        >
          <Trash2
            size={14}
            className="text-white/50 group-hover:text-red-400 m-auto"
          />
        </Button>
      </div>

      <div className="flex gap-2">
        {stage.type && <StageContent onChange={onUpdate} stage={stage} />}
      </div>
    </div>
  );
};

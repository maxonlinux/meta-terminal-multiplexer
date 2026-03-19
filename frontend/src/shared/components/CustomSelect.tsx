import { cls } from "@/shared/utils";
import { ChevronDown } from "lucide-react";
import {
  Select,
  Button,
  SelectValue,
  Popover,
  ListBox,
} from "react-aria-components";

export function CustomSelect<T extends object>({
  items,
  children,
  selectProps,
}: {
  items: Iterable<T>;
  children: React.ReactNode | ((item: T) => React.ReactNode);
  selectProps?: React.ComponentProps<typeof Select>;
}) {
  return (
    <Select
      aria-label={selectProps?.placeholder}
      {...selectProps}
      className={cls(
        "relative ml-auto text-current/50",
        selectProps?.className?.toString()
      )}
    >
      <Button className="flex items-center text-xs justify-between gap-2 cursor-pointer hover:text-white pressed:text-white">
        <SelectValue className="text-nowrap" />
        <ChevronDown size={12} aria-hidden="true" />
      </Button>
      <Popover className="bg-background border border-border rounded-sm min-w-(--trigger-width) shadow-lg shadow-black/30 overflow-hidden">
        <ListBox className="text-current/50 w-full" items={items}>
          {children}
        </ListBox>
      </Popover>
    </Select>
  );
}

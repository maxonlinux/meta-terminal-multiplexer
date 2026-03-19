"use client";

import { cls } from "@/shared/utils";
import { CheckCircle2, CircleX, Loader, LucideIcon } from "lucide-react";
import { Toast, Toaster, resolveValue } from "react-hot-toast";

const statuses: Record<string, { icon: LucideIcon; colorClass: string }> = {
  loading: { icon: Loader, colorClass: "text-white" },
  success: { icon: CheckCircle2, colorClass: "text-green-400" },
  error: { icon: CircleX, colorClass: "text-red-400" },
};

const Content = ({ t }: { t: Toast }) => {
  const Icon = statuses[t.type]?.icon;
  const colorClass = statuses[t.type]?.colorClass;

  return (
    <div
      className="relative flex w-full max-w-xs p-4 pl-8 text-white bg-background border border-border rounded-md shadow-lg shadow-black wrap-anywhere"
      role="alert"
    >
      <div className="absolute left-4 top-4.5 inline-flex items-center justify-center shrink-0">
        {Icon && (
          <Icon
            size={16}
            className={cls("", colorClass, {
              "animate-spin": t.type === "loading",
            })}
          />
        )}
      </div>
      <div className="ms-3 text-sm font-normal">
        {resolveValue(t.message, t)}
      </div>
    </div>

    // <div className="relative bg-background text-white p-4 border border-border rounded-sm text-sm max-w-96 wrap-anywhere">
    //   {Icon && (
    //     <Icon size={16} className={cls("inline-block mr-3", colorClass)} />
    //   )}
    //   {resolveValue(t.message, t)}
    // </div>
  );
};

export function CustomToaster() {
  return (
    <Toaster
      containerStyle={{
        top: 12,
        left: 12,
        bottom: 12,
        right: 12,
      }}
      position="top-right"
    >
      {(t) => <Content t={t} />}
    </Toaster>
  );
}

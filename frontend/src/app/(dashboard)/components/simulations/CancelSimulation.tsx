import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "react-aria-components";
import { useClickAnyWhere } from "usehooks-ts";
import { AnimatePresence, motion } from "motion/react";
import { UUID } from "crypto";
import { useSimulations } from "../../hooks/useSimulations";

const Content = ({
  onClose,
  onCancel,
}: {
  onClose: () => void;
  onCancel: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useClickAnyWhere((event: MouseEvent) => {
    if (ref.current?.contains(event.target as Node)) return;
    onClose();
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col gap-2 items-center justify-center backdrop-blur-2xl bg-black/20"
    >
      <Button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm px-2 py-0.5 bg-red-400/20 text-red-400 rounded-full cursor-pointer"
      >
        Click to confirm
      </Button>
    </motion.div>
  );
};

export const CancelSimulation = ({ simulationId }: { simulationId: UUID }) => {
  const [open, setOpen] = useState(false);
  const { abortSimulation } = useSimulations();

  const handleClose = () => setOpen(false);

  const handleCancel = async () => {
    try {
      await abortSimulation(simulationId);
    } catch (error) {
      console.log(error);
    } finally {
      handleClose();
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs px-2 py-0.5 bg-red-400/20 text-red-400 rounded-sm cursor-pointer"
      >
        <X size={12} /> Cancel
      </Button>
      <AnimatePresence>
        {open && <Content onCancel={handleCancel} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};

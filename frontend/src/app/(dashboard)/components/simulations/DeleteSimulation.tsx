import { Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "react-aria-components";
import { useClickAnyWhere } from "usehooks-ts";
import { AnimatePresence, motion } from "motion/react";
import { UUID } from "crypto";
import { useSimulations } from "../../hooks/useSimulations";

const Content = ({
  onClose,
  simulationId,
}: {
  onClose: () => void;
  simulationId: UUID;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useClickAnyWhere((event: MouseEvent) => {
    if (ref.current?.contains(event.target as Node)) return;
    onClose();
  });

  const { deleteSimulation } = useSimulations();

  const handleDelete = async () => {
    try {
      await deleteSimulation(simulationId);
    } catch (error) {
      console.log(error);
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
      <Button
        onClick={handleDelete}
        className="flex items-center gap-2 text-sm px-2 py-0.5 bg-red-400/20 text-red-400 rounded-full cursor-pointer"
      >
        Click to confirm
      </Button>
    </motion.div>
  );
};

export const DeleteSimulation = ({ simulationId }: { simulationId: UUID }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs px-2 py-0.5 bg-red-400/20 text-red-400 rounded-sm cursor-pointer"
      >
        <Trash2 size={12} /> Delete
      </Button>
      <AnimatePresence>
        {open && <Content simulationId={simulationId} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};

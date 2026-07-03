import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@errows/design/components/alert-dialog";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";

interface NSFWAgeConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function NSFWAgeConfirm({
  open,
  onOpenChange,
  onConfirm,
}: NSFWAgeConfirmProps) {
  const isMobile = useMobile();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "z-1050 bg-[rgba(27,18,39,1)]",
          isMobile ? "w-full" : "w-90"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-center text-xl font-bold">
            CONFIRM YOUR AGE
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/80 text-center mt-4">
            You may encounter sensitive or adult content upon enabling NSFW.
            Please confirm your age to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex mt-6 w-full sm:justify-center">
          <div className="flex gap-4 w-full">
            <AlertDialogCancel
              className="cursor-pointer rounded-full flex-1 text-white"
              style={{
                backgroundColor: "#22232A",
                border: "1px solid #2C2C38",
              }}
              onClick={handleCancel}
            >
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer rounded-full flex-1 text-white"
              style={{
                backgroundColor: "#22232A",
                border: "1px solid #2C2C38",
              }}
              onClick={handleConfirm}
            >
              I'm over 18
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

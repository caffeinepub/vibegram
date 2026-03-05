import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UploadPage } from "../pages/UploadPage";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] rounded-t-3xl bg-background border-border p-0 overflow-hidden"
        data-ocid="upload.sheet"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Create a new post</SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto scrollbar-none">
          <UploadPage onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

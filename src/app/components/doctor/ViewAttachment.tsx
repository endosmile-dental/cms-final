// components/doctor/ViewAttachment.tsx
import { Button } from "@/components/ui/button";
import { Download, FileText, Trash2, Loader2 } from "lucide-react";
import { Attachment } from "@/app/model/LabWork.model";

interface ViewAttachmentProps {
  attachment: Attachment;
  onDelete: (publicId: string) => void;
  isDeleting: boolean;
}

const ViewAttachment: React.FC<ViewAttachmentProps> = ({
  attachment,
  onDelete,
  isDeleting,
}) => {
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(
    attachment.format.toLowerCase()
  );
  const isPDF = attachment.format.toLowerCase() === "pdf";

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold truncate max-w-[70%]">
          {attachment.original_filename}
        </h2>
        <div className="flex gap-2">
          <a href={attachment.url} target="_blank" download={attachment.original_filename}>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(attachment.public_id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center items-center">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.original_filename}
            className="max-w-full max-h-[70vh] object-contain"
          />
        ) : isPDF ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-gray-500 mb-4">PDF files open in a new tab</p>
            <Button
              onClick={() => window.open(attachment.url, "_blank")}
              variant="default"
            >
              Open PDF in New Tab
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-6">
              This file format cannot be previewed
            </p>
            <a href={attachment.url} download={attachment.original_filename}>
              <Button variant="default">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Type:</span>{" "}
            {attachment.format.toUpperCase()}
          </div>
          <div>
            <span className="font-medium">Size:</span>{" "}
            {Math.round(attachment.bytes / 1024)} KB
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAttachment;

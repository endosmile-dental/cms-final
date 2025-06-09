import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Clipboard, Share2 } from "lucide-react";
import { RefObject } from "react";

interface DialogFooterActionsProps {
  captureRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

export function DialogFooterActions({
  captureRef,
  className = "",
}: DialogFooterActionsProps) {
  const captureAndGenerateImage = async (): Promise<Blob | null> => {
    if (!captureRef.current) return null;

    const canvas = await html2canvas(captureRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      ignoreElements: (element) => {
        return element.classList?.contains("no-capture");
      },
    });

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    return blob;
  };

  const handleShare = async () => {
    const blob = await captureAndGenerateImage();
    if (!blob) return;

    const file = new File([blob], "appointment.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Appointment Details",
        text: "Sharing the appointment details",
      });
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  const handleDownload = async () => {
    const blob = await captureAndGenerateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "appointment.png";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const blob = await captureAndGenerateImage();
    if (!blob) return;

    try {
      const clipboardItem = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([clipboardItem]);
      alert("Copied to clipboard as image!");
    } catch (err) {
      alert("Clipboard API not supported or permission denied.");
      console.error(err);
    }
  };

  return (
    <div className={`flex justify-end gap-2 mt-6 ${className}`}>
      <Button variant="outline" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="outline" onClick={handleCopyToClipboard}>
        <Clipboard className="mr-2 h-4 w-4" />
        Copy
      </Button>
    </div>
  );
}

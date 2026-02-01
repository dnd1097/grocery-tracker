"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

export function ReceiptUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setState("error");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      setState("parsing");

      const data = await response.json();

      setState("success");
      setReceiptId(data.receipt.id);

      // Navigate to receipt detail page after a brief delay
      setTimeout(() => {
        router.push(`/receipts/${data.receipt.id}`);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload receipt");
      setState("error");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (state === "idle" || state === "error") {
      fileInputRef.current?.click();
    }
  };

  const getStateMessage = () => {
    switch (state) {
      case "uploading":
        return "Uploading image...";
      case "parsing":
        return "Parsing receipt with AI...";
      case "success":
        return "Receipt uploaded successfully!";
      case "error":
        return error || "Upload failed";
      default:
        return "Drop receipt image here or click to browse";
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case "uploading":
      case "parsing":
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Upload className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${state === "idle" || state === "error" ? "hover:border-primary hover:bg-accent" : ""}
            ${state === "error" ? "border-red-300" : "border-muted-foreground/25"}
            ${state === "success" ? "border-green-300 bg-green-50" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            {getStateIcon()}
            <div>
              <p className="text-lg font-medium">{getStateMessage()}</p>
              {state === "idle" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Supports JPG, PNG, WEBP up to 10MB
                </p>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {state === "error" && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => {
                setState("idle");
                setError(null);
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp,image/heic";

type BillUploadProps = {
  loading: string | null;
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
};

export function BillUpload({ loading, error, onFile, onSample }: BillUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = loading !== null;

  function take(file: File | undefined) {
    if (file) onFile(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload your SDG&amp;E bill</CardTitle>
        <CardDescription>PDF or a photo from your phone. We explain every charge in plain English.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors disabled:opacity-60 ${
            dragging ? "border-primary bg-primary/10" : "border-primary/30 bg-secondary/60 hover:border-primary/60"
          }`}
        >
          {busy ? (
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          ) : (
            <FileUp className="size-8 text-primary" aria-hidden />
          )}
          <span className="text-base font-medium text-foreground">
            {busy ? loading : "Drop a bill here, or tap to choose a file"}
          </span>
          <span className="text-sm text-muted-foreground">PDF, JPG, or PNG · up to 15 MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" disabled={busy} onClick={onSample} className="w-full sm:w-auto">
            Preview with sample bill
          </Button>
          <p className="text-xs text-muted-foreground">Sample numbers are made up, for layout only.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

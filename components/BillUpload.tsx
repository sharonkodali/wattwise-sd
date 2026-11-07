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
      <CardHeader className="upload-header">
        <div><CardTitle>Bring your bill into focus</CardTitle>
        <CardDescription>Upload an SDG&amp;E statement and we’ll explain each charge in plain English.</CardDescription></div>
        <span className="upload-safe">Private &amp; secure</span>
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
          className={`upload-target ${dragging ? "is-dragging" : ""} ${busy ? "is-busy" : ""} ${
            dragging ? "border-primary bg-primary/10" : "border-primary/30 bg-secondary/60 hover:border-primary/60"
          }`}
        >
          <span className="upload-icon">{busy ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}</span>
          <span className="upload-copy"><strong>{busy ? loading : "Drop your bill here"}</strong><span>or <u>browse files</u> from this device</span></span>
          <span className="upload-formats">PDF, JPG, PNG or HEIC <i /> Up to 4 MB (big photos are shrunk)</span>
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
        <div className="upload-bottom">
          <Button type="button" variant="outline" disabled={busy} onClick={onSample} className="sample-button">
            Explore with a sample bill
          </Button>
          <p>The sample is a made-up bill, read live by Gemini.</p>
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

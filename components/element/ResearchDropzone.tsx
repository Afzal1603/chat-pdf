"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadToS3 } from "@/lib/s3/s3";
import { useRouter } from "next/navigation";
import { Inbox, X, FileText, Loader2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

type FileEntry = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  s3Key?: string;
  s3Name?: string;
};

const ResearchDropzone = () => {
  const router = useRouter();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = 5 - files.length;
      const toAdd = acceptedFiles.slice(0, remaining);

      if (acceptedFiles.length > remaining) {
        toast.error(`Maximum 5 PDFs allowed. Only ${remaining} slot(s) left.`);
      }

      const oversized = toAdd.filter((f) => f.size > 10 * 1024 * 1024);
      if (oversized.length > 0) {
        toast.error("Each file must be under 10 MB.");
        return;
      }

      setFiles((prev) => [
        ...prev,
        ...toAdd.map((f) => ({ file: f, status: "pending" as const })),
      ]);
    },
    [files],
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop,
    disabled: files.length >= 5 || submitting,
    noClick: files.length >= 5,
  });

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setSubmitting(true);

    try {
      // Upload each pending file to S3
      const updatedFiles = [...files];
      for (let i = 0; i < updatedFiles.length; i++) {
        if (updatedFiles[i].status !== "pending") continue;
        updatedFiles[i] = { ...updatedFiles[i], status: "uploading" };
        setFiles([...updatedFiles]);

        try {
          const data = await uploadToS3(updatedFiles[i].file);
          updatedFiles[i] = {
            ...updatedFiles[i],
            status: "done",
            s3Key: data.file_key,
            s3Name: data.file_name,
          };
          setFiles([...updatedFiles]);
        } catch {
          updatedFiles[i] = { ...updatedFiles[i], status: "error" };
          setFiles([...updatedFiles]);
          toast.error(`Failed to upload ${updatedFiles[i].file.name}`);
        }
      }

      const uploadedFiles = updatedFiles.filter(
        (f) => f.status === "done" && f.s3Key,
      );
      if (uploadedFiles.length === 0) {
        toast.error("No files were uploaded successfully");
        return;
      }

      // Create research session
      const response = await axios.post("/api/research/create", {
        files: uploadedFiles.map((f) => ({
          file_key: f.s3Key!,
          file_name: f.s3Name!,
        })),
      });

      toast.success("Research session created!");
      router.push(`/research/${response.data.session_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: FileEntry["status"]) => {
    if (status === "uploading")
      return <Loader2 size={14} className="animate-spin text-indigo-300" />;
    if (status === "done") return <span className="text-green-400 text-xs">✓</span>;
    if (status === "error") return <span className="text-red-400 text-xs">✗</span>;
    return null;
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          rounded-2xl p-2 cursor-pointer transition-all duration-300
          bg-white/5 backdrop-blur-lg border
          ${isDragActive ? "border-indigo-400/80 bg-white/10" : "border-white/15 hover:border-indigo-400/60 hover:bg-white/10"}
          ${files.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}
          shadow-sm hover:shadow-md
        `}
      >
        <input {...getInputProps()} />
        <div className="w-full h-32 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-white/25">
          {isDragActive ? (
            <p className="text-indigo-300 font-medium">Drop PDFs here...</p>
          ) : (
            <>
              <Inbox size={36} className="text-indigo-300" />
              <p className="mt-2 text-sm font-medium text-center text-white/80">
                {files.length >= 5
                  ? "Maximum 5 PDFs added"
                  : "Drop PDFs here or click to select"}
              </p>
              <p className="text-xs mt-1 text-white/50">
                PDF only · Max 10MB each · Up to 5 files ({files.length}/5)
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
            >
              <FileText size={16} className="text-indigo-300 shrink-0" />
              <span className="flex-1 text-sm text-white/80 truncate">
                {entry.file.name}
              </span>
              {statusIcon(entry.status)}
              {!submitting && entry.status === "pending" && (
                <button
                  onClick={() => removeFile(idx)}
                  className="text-white/40 hover:text-red-400 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={submitting || files.every((f) => f.status === "error")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            bg-gradient-to-r from-emerald-500 to-teal-600
            hover:from-teal-600 hover:to-emerald-600
            text-white font-semibold shadow-md hover:shadow-lg transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FlaskConical size={18} />
              Start Research Session ({files.length} PDF{files.length > 1 ? "s" : ""})
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ResearchDropzone;

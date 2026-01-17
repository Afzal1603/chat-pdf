"use client";
import React from "react";
import { uploadToS3 } from "@/lib/s3/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Dropbox = () => {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  const { mutate, isLoading } = useMutation({
    mutationFn: async ({
      file_name,
      file_key,
    }: {
      file_name: string;
      file_key: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_name,
        file_key,
      });
      return response.data;
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      const data = await uploadToS3(file);

      if (!data?.file_key || !data?.file_name) {
        toast.error("Error uploading file");
        return;
      }

      mutate(data, {
        onSuccess: ({ chat_id }) => {
          toast.success("Chat created successfully");
          router.push(`/chat/${chat_id}`);
        },
        onError: () => {
          toast.error("Error uploading file");
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop,
  });

  return (
    <div
      {...getRootProps()}
      className="
        w-[420px] h-[160px]
        rounded-2xl p-2
        cursor-pointer
        transition-all duration-300
        bg-white/5 backdrop-blur-lg
        border border-white/15
        hover:border-indigo-400/60
        hover:bg-white/10
        shadow-sm hover:shadow-md
      "
    >
      <input {...getInputProps()} />

      <div
        className="
          w-full h-full rounded-xl
          flex flex-col items-center justify-center
          border-2 border-dashed border-white/25
        "
      >
        {uploading || isLoading ? (
          <Loader2 size={46} className="animate-spin text-indigo-300" />
        ) : (
          <>
            <Inbox size={46} className="text-indigo-300" />
            <p
              className="
                mt-2 text-sm font-medium text-center
                text-white/80
              "
            >
              Drop your PDF here or click to upload
            </p>
            <p className="text-xs mt-1 text-white/50">PDF only · Max 10MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Dropbox;

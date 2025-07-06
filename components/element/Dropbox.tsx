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
          console.log(data);
        },
        onError: (error) => {
          toast.error("Error uploading file");
          console.log(error);
        },
      });
      console.log(data);
    } catch (error) {
      console.log(error);
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
      className="border-3 border-indigo-500 p-2 rounded-xl w-98 h-36 flex justify-center items-center transition-all duration-300 shadow-md hover:shadow-lg hover:border-purple-500 bg-white/70 backdrop-blur-md hover:cursor-pointer"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col justify-center items-center border-2 border-dashed border-purple-400 w-full h-full rounded-lg">
        {uploading || isLoading ? (
          <Loader2 size={48} className="animate-spin text-indigo-600"></Loader2>
        ) : (
          <>
            <Inbox className="text-indigo-600 " size={48} />
            <p className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700 mt-2">
              Drop your PDF here or click to upload
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Dropbox;

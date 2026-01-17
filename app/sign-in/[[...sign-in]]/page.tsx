import { SignIn } from "@clerk/nextjs";
import React from "react";

const Page = () => {
  return (
    <div
      className="
        flex justify-center items-center h-screen px-4
        bg-gradient-to-br from-[#0f1220] via-[#14172a] to-[#1b1f36]
      "
    >
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#6366f1", // indigo
            colorBackground: "#e6e6e6", // 🔹 lighter card
            colorText: "#2c2c2c", // main text
            colorTextSecondary: "#787878",
            borderRadius: "0.45rem",
          },
          elements: {
            card: "bg-[#2a2f4a] shadow-2xl",

            headerTitle: "text-gray-50 text-lg font-semibold",
            headerSubtitle: "text-gray-300",

            socialButtonsBlockButton:
              "bg-red-500 hover:bg-[#3a4070] text-gray-100 border border-white/15",

            formButtonPrimary:
              "bg-indigo-600 hover:bg-indigo-700 text-white font-medium",

            footerActionText: "text-gray-300",
            footerActionLink: "text-indigo-300 hover:text-indigo-200",

            formFieldInput:
              "bg-[#323862] border border-white/15 text-gray-100 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-0",

            formFieldLabel: "text-gray-200",
          },
        }}
      />
    </div>
  );
};

export default Page;

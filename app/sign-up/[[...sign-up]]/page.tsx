import { SignUp } from "@clerk/nextjs";
import React from "react";

const Page = () => {
  return (
    <div
      className="
        w-full h-screen flex items-center justify-center
        bg-gradient-to-br from-[#1b1f2a] via-[#1f2333] to-[#262b40]
        px-4
      "
    >
      {/* ================= Brand ================= */}
      <h1
        className="
          absolute top-6 left-6
          text-xl font-extrabold tracking-tight
          bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300
          text-transparent bg-clip-text
        "
      >
        Intelidocs
      </h1>

      {/* ================= Auth Card ================= */}
      <div
        className="
          w-full max-w-md
          rounded-2xl
          bg-white/10 backdrop-blur-xl
          border border-white/20
          shadow-2xl
          p-6
        "
      >
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#6366f1", // indigo-500
              colorText: "#e5e7eb", // gray-200
              colorTextSecondary: "#9ca3af",
              colorBackground: "transparent",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-transparent shadow-none",
              headerTitle: "text-white text-xl font-semibold",
              headerSubtitle: "text-white/60",
              socialButtonsBlockButton:
                "bg-white/10 hover:bg-white/20 text-white border border-white/20",
              formButtonPrimary:
                "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold",
              footerActionText: "text-white/60",
              footerActionLink: "text-indigo-300 hover:text-indigo-200",
              formFieldInput:
                "bg-white/10 text-white border border-white/20 focus:border-indigo-400",
              formFieldLabel: "text-white/70",
            },
          }}
        />
      </div>
    </div>
  );
};

export default Page;

import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LogIn, FlaskConical } from "lucide-react";
import Dropbox from "@/components/element/Dropbox";


const Page = async () => {
  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center px-6 overflow-hidden
      bg-gradient-to-br from-[#1b1f2a] via-[#1f2333] to-[#262b40]"
    >
      {/* ================= Brand (Top Left) ================= */}
      <h1
        className="absolute top-5 left-6 text-xl font-extrabold tracking-tight
        bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300
        text-transparent bg-clip-text"
      >
        Intelidocs
      </h1>

      {/* ================= User Button ================= */}
      {isAuth && (
        <div className="absolute top-5 right-6">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: {
                  width: "44px",
                  height: "44px",
                },
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      )}

      {/* ================= Hero ================= */}
      {!isAuth && (
        <h1
          className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6
          bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300
          text-transparent bg-clip-text text-center"
        >
          Intelidocs
        </h1>
      )}

      {/* ================= Headline ================= */}
      <h2
        className="text-3xl sm:text-4xl font-bold text-center max-w-3xl
        text-white/90"
      >
        {isAuth
          ? "Welcome back. Ready to unlock insights from your PDFs?"
          : "Turn any PDF into a powerful conversation"}
      </h2>

      {/* ================= Subheading ================= */}
      <p
        className="mt-5 max-w-2xl text-center text-base sm:text-lg
        text-white/60"
      >
        Transform static documents into dynamic conversations — perfect for
        research, learning, and understanding complex content effortlessly.
      </p>

      {/* ================= CTA ================= */}
      <div className="mt-10">
        {isAuth ? (
          <div className="flex flex-col items-center gap-6">
            <Link href="/chat">
              <Button
                className="px-6 py-4 text-lg font-semibold rounded-xl
                bg-gradient-to-r from-indigo-500 to-violet-600
                hover:from-violet-600 hover:to-indigo-600
                text-white shadow-lg hover:shadow-xl transition-all"
              >
                Go to Chats
              </Button>
            </Link>

            <Dropbox />

            {/* Research Mode Entry */}
            <div className="w-[420px] rounded-2xl p-5 bg-white/5 backdrop-blur-lg border border-emerald-500/20 hover:border-emerald-400/40 hover:bg-white/10 transition-all shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FlaskConical size={22} />
                </div>
                <div>
                  <h3 className="text-white/90 font-semibold text-sm">Research Mode</h3>
                  <p className="text-white/50 text-xs">Compare up to 5 PDFs side-by-side</p>
                </div>
              </div>
              <Link href="/research">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-semibold transition-all">
                  Open Research Mode
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/sign-in">
            <Button
              className="px-6 py-4 text-lg font-semibold rounded-xl
              bg-gradient-to-r from-indigo-500 to-violet-600
              hover:from-violet-600 hover:to-indigo-600
              text-white shadow-lg hover:shadow-xl transition-all"
            >
              Login to get started
              <LogIn className="ml-2 p-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Page;

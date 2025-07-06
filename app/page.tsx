import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LogIn } from "lucide-react";
import Dropbox from "@/components/element/Dropbox";

const page = async () => {
  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-200 via-white to-indigo-200  flex flex-col justify-center items-center px-4">
      {/* Hero Title */}
      <h1 className="hover:cursor-pointer hover:bg-gradient-to-r hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500  absolute top-1 left-1 text-2xl font-extrabold font-['Inter'] bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight drop-shadow-sm mt-2 ml-2">
        Intelidocs
      </h1>

      {isAuth ? (
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: "80px",
                height: "80px",
              },
            },
          }}
          afterSignOutUrl="/"
        />
      ) : (
        <h1 className=" absolute top-50 text-6xl font-extrabold font-['Inter'] bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight drop-shadow-sm">
          Intelidocs
        </h1>
      )}
      {/* User Button */}

      {/* Heading and CTA */}
      <div className="flex items-center gap-1.5 justify-center mt-4">
        <div className="flex flex-col items-center">
          <h2 className=" text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-900 text-center">
            {isAuth
              ? "Welcome back! Ready to unlock insights from your PDFs?"
              : "Turn any PDF into a powerful conversation"}
          </h2>

          {isAuth && (
            <Button className="text-white hover:cursor-pointer mt-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-600 transition-all duration-300">
              Go to Chats
            </Button>
          )}
        </div>
      </div>

      {/* Subheading */}
      <div className="text-center px-4 mt-6">
        <p className="text-md sm:text-lg max-w-2xl font-medium text-gray-700">
          Join now to transform static documents into dynamic conversations —
          ideal for research, learning, and understanding complex content.
        </p>
      </div>

      {/* Action Area */}
      <div className="mt-6">
        {isAuth ? (
          <Dropbox />
        ) : (
          <Link href="/sign-in">
            <Button className="animate-pulse hover:animate-none text-white mt-2 hover:cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-purple-800 hover:to-indigo-700 transition-all duration-300">
              Login to get started!
              <LogIn className="ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default page;

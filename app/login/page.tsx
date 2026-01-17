// File: app/sign-in/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Login failed");

      // on success: redirect to /chats (or wherever)
      router.push("/chats");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-200 via-white to-indigo-200 flex flex-col justify-center items-center px-4">
      <h1 className="absolute top-4 left-4 text-2xl font-extrabold font-['Inter'] bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight">
        Intelidocs
      </h1>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 mt-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-900">
            Welcome back
          </h2>
          <p className="text-sm text-gray-700 mt-2">
            Sign in to continue and ask questions from your PDFs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Your password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>

            <Button
              type="submit"
              className="text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-purple-800 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-700 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By continuing you agree to our{" "}
            <span className="underline">Terms</span> and{" "}
            <span className="underline">Privacy</span>.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <Link href="/" className="inline-flex items-center gap-2">
          <LogIn /> Back to landing
        </Link>
      </div>
    </div>
  );
}

// // File: app/register/page.tsx
// ("use client");

// import React, { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";

// export default function RegisterPage() {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!name || !email || !password || !confirm) {
//       setError("Please fill all fields.");
//       return;
//     }
//     if (password.length < 6) {
//       setError("Password should be at least 6 characters.");
//       return;
//     }
//     if (password !== confirm) {
//       setError("Passwords do not match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, email, password }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Registration failed");

//       // on success: redirect to sign-in
//       router.push("/sign-in");
//     } catch (err: any) {
//       setError(err.message || "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-gradient-to-br from-purple-200 via-white to-indigo-200 flex flex-col justify-center items-center px-4">
//       <h1 className="absolute top-4 left-4 text-2xl font-extrabold font-['Inter'] bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight">
//         Intelidocs
//       </h1>

//       <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 mt-6">
//         <div className="text-center mb-6">
//           <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-900">
//             Create your account
//           </h2>
//           <p className="text-sm text-gray-700 mt-2">
//             Join Intelidocs to unlock smart PDF conversations
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label
//               htmlFor="name"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Full name
//             </label>
//             <input
//               id="name"
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               placeholder="John Doe"
//               required
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               placeholder="you@company.com"
//               required
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               placeholder="Create a password"
//               required
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="confirm"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Confirm Password
//             </label>
//             <input
//               id="confirm"
//               type="password"
//               value={confirm}
//               onChange={(e) => setConfirm(e.target.value)}
//               className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               placeholder="Repeat your password"
//               required
//             />
//           </div>

//           {error && <p className="text-sm text-red-600">{error}</p>}

//           <div className="flex justify-end">
//             <Button
//               type="submit"
//               className="text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-purple-800 hover:to-indigo-700"
//               disabled={loading}
//             >
//               {loading ? "Creating..." : "Create account"}
//             </Button>
//           </div>
//         </form>

//         <div className="mt-6 text-center">
//           <p className="text-sm text-gray-600">
//             Already registered?{" "}
//             <Link
//               href="/sign-in"
//               className="font-medium text-indigo-700 hover:underline"
//             >
//               Sign in
//             </Link>
//           </p>
//         </div>

//         <div className="mt-6 text-center text-xs text-gray-500">
//           <p>
//             We use secure authentication. Read our{" "}
//             <span className="underline">Privacy Policy</span> for details.
//           </p>
//         </div>
//       </div>

//       <div className="mt-6 text-center text-sm text-gray-600">
//         <p className="max-w-xl text-center px-4">
//           Tip: You can implement social sign-ups or add CAPTCHA for extra
//           security.
//         </p>
//       </div>
//     </div>
//   );
// }

// // OPTIONAL: Example API route implementations (Next 13 app router) — place under app/api/auth/*.ts (or /route.ts)

// // File: app/api/auth/register/route.ts
// // NOTE: example only. Replace storage/db logic with your real user store and hashing.

// /*
// import { NextResponse } from 'next/server'
// import bcrypt from 'bcryptjs'

// export async function POST(req: Request) {
//   const { name, email, password } = await req.json()
//   if (!name || !email || !password) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

//   // TODO: check if user exists in DB
//   // const existing = await db.user.findUnique({ where: { email } })
//   // if (existing) return NextResponse.json({ message: 'User exists' }, { status: 409 })

//   const hashed = await bcrypt.hash(password, 10)
//   // TODO: insert user into DB
//   // await db.user.create({ data: { name, email, password: hashed } })

//   return NextResponse.json({ ok: true })
// }
// */

// // File: app/api/auth/login/route.ts
// /*
// import { NextResponse } from 'next/server'
// import bcrypt from 'bcryptjs'

// export async function POST(req: Request) {
//   const { email, password } = await req.json()
//   if (!email || !password) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

//   // TODO: lookup user
//   // const user = await db.user.findUnique({ where: { email } })
//   // if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })

//   // const valid = await bcrypt.compare(password, user.password)
//   // if (!valid) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })

//   // TODO: create session / set cookie / return token
//   return NextResponse.json({ ok: true })
// }
// */

// // End of document

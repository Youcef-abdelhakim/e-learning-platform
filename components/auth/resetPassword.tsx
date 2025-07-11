"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { commonAuthApi } from "@/api/auth/commonAuth.api";
import { validateEmail } from "@/utils";
import showAlert from "../ui/AlertC";
const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const isMounted = useRef(false);

  const resetPasswordMutation = useMutation({
    mutationFn: commonAuthApi.resetPassword,
    onSuccess: () => {
      showAlert("success", "Check your email for the reset link.");
    },
    onError: () => {
      showAlert("error", "Failed to send reset link. Please try again.");
    },
  });

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmail(email);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    resetPasswordMutation.mutate(email);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Reset Your Password
        </h1>
        <p className="text-gray-600">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--addi-color-400)] focus:border-transparent transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--addi-color-400)] hover:bg-[var(--addi-color-500)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--addi-color-400)] transition-colors cursor-pointer"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending
            ? "Sending reset link..."
            : "Send Reset Link"}
        </button>

        <div className="text-center">
          <Link
            href="/auth"
            className="text-sm text-gray-600 hover:text-[var(--addi-color-400)] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;

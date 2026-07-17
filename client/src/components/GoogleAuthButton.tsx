import { useRef } from "react";
import {
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

import { useGoogleAuth, type User } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface GoogleAuthButtonProps {
  onSuccess: (user: User) => void;
  /** Only applies when Google creates a brand-new account; ignored for existing accounts. Defaults to "buyer". */
  role?: "buyer" | "seller";
}

export function GoogleAuthButton({
  onSuccess,
  role,
}: GoogleAuthButtonProps) {
  const googleRef = useRef<HTMLDivElement>(null);

  const { login } = useAuth();
  const { toast } = useToast();
  const googleAuthMutation = useGoogleAuth();

  const handleCredential = (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Google Sign In Failed",
        description: "No credential returned.",
        variant: "destructive",
      });
      return;
    }

    googleAuthMutation.mutate(
      {
        data: {
          credential: credentialResponse.credential,
          role,
        },
      },
      {
        onSuccess: (response) => {
          login(
            {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            },
            response.user
          );

          onSuccess(response.user);
        },

        onError: (error) => {
          toast({
            title: "Google Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCustomClick = () => {
    const button =
      googleRef.current?.querySelector(
        'div[role="button"]'
      ) as HTMLElement | null;

    button?.click();
  };

  return (
    <>
      {/* Hidden Google Button */}
      <div
        ref={googleRef}
        className="absolute opacity-0 pointer-events-none"
      >
        <GoogleLogin
          onSuccess={handleCredential}
          onError={() =>
            toast({
              title: "Google Sign In Failed",
              variant: "destructive",
            })
          }
          useOneTap={false}
        />
      </div>

      {/* Custom Button */}
      <button
        type="button"
        onClick={handleCustomClick}
        className="w-full max-w-md h-12 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
      >
        <FcGoogle className="text-2xl" />

        <span className="text-[16px] font-medium text-gray-700">
          Continue with Google
        </span>
      </button>
    </>
  );
}
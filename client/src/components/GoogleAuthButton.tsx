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

  return (
    // Wrapper defines the visual size/shape of the button. The real
    // Google button is stacked on top with opacity 0 but pointer-events
    // left ON, so the user's actual click lands on Google's iframe
    // (a trusted click) instead of a JS-triggered .click() on a hidden
    // button, which browsers/FedCM intermittently block.
    <div className="relative w-full max-w-md h-12">
      {/* Custom look — purely decorative, sits underneath */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-gray-300 bg-white flex items-center justify-center gap-3 shadow-sm pointer-events-none"
      >
        <FcGoogle className="text-2xl" />
        <span className="text-[16px] font-medium text-gray-700">
          Continue with Google
        </span>
      </div>

      {/* Real Google button — invisible but receives the actual click */}
      <div className="absolute inset-0 opacity-0 overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full">
        <GoogleLogin
          onSuccess={handleCredential}
          onError={() =>
            toast({
              title: "Google Sign In Failed",
              variant: "destructive",
            })
          }
          useOneTap={false}
          size="large"
          width="400"
        />
      </div>
    </div>
  );
}
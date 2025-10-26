import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignUpEmailMutation } from "@/features/auth/hooks/use-sign-up-email-mutation";
import { useSignUpSocialMutation } from "@/features/auth/hooks/use-sign-up-social-mutation";
import { signUpSchema } from "@/features/auth/schemas/sign-up";
import type { SignUpVariables } from "@/features/auth/types";

export const useSignUpForm = () => {
  const form = useForm<SignUpVariables>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const { mutate: signUpWithEmail, isPending: isSigningUpWithEmail } =
    useSignUpEmailMutation({
      form,
    });

  const { mutate: signUpWithSocial, isPending: isSigningUpWithSocial } =
    useSignUpSocialMutation();

  const onSubmit = (variables: SignUpVariables) => signUpWithEmail(variables);

  const handleSignUpWithSocial = (provider: "google") =>
    signUpWithSocial({ provider });

  const handleSignUpWithGoogle = () => handleSignUpWithSocial("google");

  return {
    form,
    onSubmit,
    isPending: isSigningUpWithEmail || isSigningUpWithSocial,
    handleSignUpWithGoogle,
  };
};

import { useMemo } from "react";

interface Props {
  password: string;
}

export const usePasswordStrengthIndicator = ({ password }: Props) => {
  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: "8 o más caracteres" },
      { regex: /[0-9]/, text: "Al menos un número" },
      { regex: /[a-z]/, text: "Al menos una letra minúscula" },
      { regex: /[A-Z]/, text: "Al menos una letra mayúscula" },
      { regex: /[^\w\s]/, text: "Al menos un carácter especial" },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const strength = checkStrength(password);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-amber-500";
    if (score <= 4) return "bg-lime-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Ingresa una contraseña";
    if (score <= 2) return "Contraseña débil";
    if (score <= 3) return "Contraseña media";
    if (score <= 4) return "Contraseña fuerte";
    return "Contraseña muy fuerte";
  };

  return {
    strength,
    strengthScore,
    getStrengthColor,
    getStrengthText,
  };
};

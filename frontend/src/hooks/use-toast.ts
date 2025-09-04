type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    // Por ahora usaremos un alert simple, pero después se puede integrar con un sistema de toast más sofisticado
    const message = description ? `${title}: ${description}` : title;

    if (variant === "destructive") {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  };

  return { toast };
};

export { useToast };

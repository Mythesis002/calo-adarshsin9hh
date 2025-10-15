import { UtensilsCrossed } from "lucide-react";

const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
        <UtensilsCrossed 
          className="h-16 w-16 text-primary animate-wobble"
          strokeWidth={2.5}
        />
      </div>
      <div className="flex gap-2 items-center">
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce-soft" style={{ animationDelay: '0s' }} />
        <div className="h-2 w-2 bg-secondary rounded-full animate-bounce-soft" style={{ animationDelay: '0.1s' }} />
        <div className="h-2 w-2 bg-accent rounded-full animate-bounce-soft" style={{ animationDelay: '0.2s' }} />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        AI is thinking...
      </p>
    </div>
  );
};

export default LoadingAnimation;

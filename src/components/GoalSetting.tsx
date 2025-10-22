import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingAnimation from "./LoadingAnimation";

interface GoalSettingProps {
  onGoalSet: (goal: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const GoalSetting = ({ onGoalSet, isLoading, setIsLoading }: GoalSettingProps) => {
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [goalType, setGoalType] = useState<"gain" | "lose" | "maintain">("gain");

  const handleCreatePlan = async () => {
    if (!currentWeight || !targetWeight) {
      toast.error("Please enter both current and target weight");
      return;
    }

    const current = parseFloat(currentWeight);
    const target = parseFloat(targetWeight);

    if (isNaN(current) || isNaN(target) || current <= 0 || target <= 0) {
      toast.error("Please enter valid weight values");
      return;
    }

    setIsLoading(true);

    try {
      const goal = `${goalType === "gain" ? "Gain" : goalType === "lose" ? "Lose" : "Maintain"} ${Math.abs(target - current)} kg`;
      
      const { data, error } = await supabase.functions.invoke('plan-goal', {
        body: { goal, currentWeight: current, targetWeight: target }
      });

      if (error) throw error;

      onGoalSet({
        goal,
        currentWeight: current,
        targetWeight: target,
        dailyCalorieTarget: data.dailyCalorieTarget,
        burnSuggestion: data.burnSuggestion,
      });

      toast.success("Goal set successfully! 🎯");
    } catch (error: any) {
      console.error('Error setting goal:', error);
      toast.error(error.message || "Failed to create plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <LoadingAnimation />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-2xl overflow-hidden relative backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <CardHeader className="space-y-3 relative z-10 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Set Your Health Goal
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Create a personalized nutrition plan tailored for you
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setGoalType("gain")}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              goalType === "gain"
                ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg scale-105"
                : "border-border/50 bg-card/50 hover:border-primary/50 hover:scale-102"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                goalType === "gain"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10"
              }`}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className={`font-semibold transition-colors ${
                goalType === "gain" ? "text-primary" : "text-foreground/70"
              }`}>
                Gain Weight
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setGoalType("lose")}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              goalType === "lose"
                ? "border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-lg scale-105"
                : "border-border/50 bg-card/50 hover:border-secondary/50 hover:scale-102"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                goalType === "lose"
                  ? "bg-secondary text-secondary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground group-hover:bg-secondary/10"
              }`}>
                <TrendingDown className="h-6 w-6" />
              </div>
              <span className={`font-semibold transition-colors ${
                goalType === "lose" ? "text-secondary" : "text-foreground/70"
              }`}>
                Lose Weight
              </span>
            </div>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3 group">
            <Label htmlFor="currentWeight" className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Current Weight (kg)
            </Label>
            <Input
              id="currentWeight"
              type="number"
              placeholder="e.g., 70"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="text-xl h-14 px-5 bg-background/50 border-2 border-border/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            />
          </div>

          <div className="space-y-3 group">
            <Label htmlFor="targetWeight" className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              Target Weight (kg)
            </Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder="e.g., 72"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="text-xl h-14 px-5 bg-background/50 border-2 border-border/50 focus:border-accent transition-all duration-300 focus:shadow-lg focus:shadow-accent/10"
            />
          </div>
        </div>

        <Button
          onClick={handleCreatePlan}
          className="w-full text-lg h-14 rounded-xl bg-gradient-to-r from-primary via-primary to-accent hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] font-semibold"
          size="lg"
        >
          <Target className="mr-2 h-5 w-5" />
          Create My Plan
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoalSetting;

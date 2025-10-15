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
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2 text-primary">
          <Target className="h-6 w-6" />
          Set Your Health Goal
        </CardTitle>
        <CardDescription>
          Let's create a personalized nutrition plan for you!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 justify-center">
          <Button
            variant={goalType === "gain" ? "default" : "outline"}
            onClick={() => setGoalType("gain")}
            className="flex-1"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Gain Weight
          </Button>
          <Button
            variant={goalType === "lose" ? "default" : "outline"}
            onClick={() => setGoalType("lose")}
            className="flex-1"
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Lose Weight
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentWeight">Current Weight (kg)</Label>
            <Input
              id="currentWeight"
              type="number"
              placeholder="e.g., 70"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetWeight">Target Weight (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder="e.g., 72"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="text-lg"
            />
          </div>
        </div>

        <Button
          onClick={handleCreatePlan}
          className="w-full text-lg py-6"
          size="lg"
        >
          Create My Plan ✨
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoalSetting;

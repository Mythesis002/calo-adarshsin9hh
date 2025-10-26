import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingAnimation from "./LoadingAnimation";

interface FoodLoggerProps {
  currentCalories: number;
  targetCalories: number;
  onMealLogged: (log: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FoodLogger = ({ 
  currentCalories, 
  targetCalories, 
  onMealLogged, 
  isLoading,
  setIsLoading 
}: FoodLoggerProps) => {
  const [mealDescription, setMealDescription] = useState("");

  const handleLogMeal = async () => {
    if (!mealDescription.trim()) {
      toast.error("Please describe your meal");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-meal', {
        body: {
          mealDescription: mealDescription.trim(),
          currentCalories,
          targetCalories,
        }
      });

      if (error) throw error;

      const newLog = {
        timestamp: Date.now(),
        text: data.foodItem,
        calories: data.estimatedCalories,
        suggestion: data.completionSuggestion,
      };

      onMealLogged(newLog);
      setMealDescription("");
      toast.success(`Logged: ${data.foodItem} (${data.estimatedCalories} kcal)`);
    } catch (error: any) {
      console.error('Error logging meal:', error);
      toast.error(error.message || "Failed to log meal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calorieProgress = (currentCalories / targetCalories) * 100;
  const remainingCalories = targetCalories - currentCalories;

  return (
    <div className="space-y-4">
      {/* Meal Logging Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Log Your Meal</CardTitle>
              <CardDescription>Describe what you ate and AI will estimate calories</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-12">
              <LoadingAnimation />
            </div>
          ) : (
            <>
              <Textarea
                placeholder="e.g., 'Had 2 rotis with dal and aloo sabzi for lunch' or '1 extra roti with palak paneer'"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isLoading}
              />
              
              <Button
                onClick={handleLogMeal}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-5 w-5" />
                Log Meal with AI
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Calorie Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold">Today's Progress</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Current</div>
              <div className="text-2xl font-bold text-secondary">{currentCalories}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <div className="text-2xl font-bold text-accent">{remainingCalories > 0 ? remainingCalories : 0}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Target</div>
              <div className="text-2xl font-bold text-primary">{targetCalories}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.min(Math.round(calorieProgress), 100)}%</span>
            </div>
            <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodLogger;

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
      {/* Meal Logging Card - Now at the top */}
      <Card className="border-accent/20 bg-gradient-to-br from-card via-card/95 to-accent/5 backdrop-blur-sm shadow-xl overflow-hidden relative animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <CardHeader className="space-y-1 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                Log Your Meal
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Describe what you ate - AI will calculate calories instantly!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          {isLoading ? (
            <div className="py-12">
              <LoadingAnimation />
            </div>
          ) : (
            <>
              <div className="relative">
                <Textarea
                  placeholder="e.g., 'Had 2 rotis with dal and aloo sabzi for lunch' or '1 extra roti with palak paneer'"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="min-h-[140px] text-base resize-none border-2 border-accent/20 focus:border-accent/50 bg-background/50 backdrop-blur-sm shadow-inner rounded-xl"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                onClick={handleLogMeal}
                className="w-full text-lg py-7 bg-gradient-to-r from-accent via-primary to-secondary hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg group"
                size="lg"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Log Meal with AI
              </Button>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-muted backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Target className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Simply describe your meal naturally. Our AI will identify the food items and estimate calories for you.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Calorie Progress Overview - Now below, more compact */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 backdrop-blur-sm shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50"></div>
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">Today's Progress</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/30">
              <div className="text-xs font-medium text-muted-foreground mb-1">Current</div>
              <div className="text-2xl font-bold text-secondary">{currentCalories}</div>
              <div className="text-xs text-secondary/70">kcal</div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30">
              <div className="text-xs font-medium text-muted-foreground mb-1">Remaining</div>
              <div className="text-2xl font-bold text-accent">{remainingCalories > 0 ? remainingCalories : 0}</div>
              <div className="text-xs text-accent/70">kcal</div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30">
              <div className="text-xs font-medium text-muted-foreground mb-1">Target</div>
              <div className="text-2xl font-bold text-primary">{targetCalories}</div>
              <div className="text-xs text-primary/70">kcal</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold text-primary">{Math.min(Math.round(calorieProgress), 100)}%</span>
              </div>
              <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodLogger;

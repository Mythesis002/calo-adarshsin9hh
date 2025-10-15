import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
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

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2 text-primary">
          <Sparkles className="h-6 w-6" />
          Log Your Meal
        </CardTitle>
        <CardDescription>
          Describe what you ate in natural language - AI will handle the rest!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            <Textarea
              placeholder="e.g., 'Had 2 rotis with dal and aloo sabzi for lunch' or '1 extra roti with palak paneer'"
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              className="min-h-[120px] text-base resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleLogMeal}
              className="w-full text-lg py-6"
              size="lg"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-5 w-5" />
              Log Meal
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodLogger;

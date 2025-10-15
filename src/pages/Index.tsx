import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, User } from "lucide-react";
import GoalSetting from "@/components/GoalSetting";
import FoodLogger from "@/components/FoodLogger";
import Dashboard from "@/components/Dashboard";

interface Goal {
  goal: string;
  currentWeight: number;
  targetWeight: number;
  dailyCalorieTarget: number;
  burnSuggestion: string;
}

interface DailyLog {
  timestamp: number;
  text: string;
  calories: number;
  suggestion?: string;
}

const Index = () => {
  const [userGoal, setUserGoal] = useState<Goal | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("goal");

  const currentCalories = dailyLogs.reduce((sum, log) => sum + log.calories, 0);
  const targetCalories = userGoal?.dailyCalorieTarget || 0;

  const handleGoalSet = (goal: Goal) => {
    setUserGoal(goal);
    setActiveTab("log");
  };

  const handleMealLogged = (log: DailyLog) => {
    setDailyLogs((prev) => [...prev, log]);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg animate-float">
                <Heart className="h-8 w-8 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Shakti
                </h1>
                <p className="text-xs text-muted-foreground">AI Health Planner</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Guest User</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14">
            <TabsTrigger value="goal" className="text-base">
              🎯 Goal
            </TabsTrigger>
            <TabsTrigger value="log" className="text-base" disabled={!userGoal}>
              ✏️ Log Meal
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-base" disabled={!userGoal}>
              📊 Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="space-y-6">
            {userGoal ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/20">
                  <h2 className="text-2xl font-bold mb-2">Current Goal</h2>
                  <p className="text-lg mb-1">
                    <span className="font-semibold">{userGoal.goal}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userGoal.currentWeight} kg → {userGoal.targetWeight} kg
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Daily Target: <span className="font-bold text-primary">{userGoal.dailyCalorieTarget} kcal</span>
                  </p>
                </div>
                <GoalSetting 
                  onGoalSet={handleGoalSet}
                  isLoading={isLLMLoading}
                  setIsLoading={setIsLLMLoading}
                />
              </div>
            ) : (
              <GoalSetting 
                onGoalSet={handleGoalSet}
                isLoading={isLLMLoading}
                setIsLoading={setIsLLMLoading}
              />
            )}
          </TabsContent>

          <TabsContent value="log" className="space-y-6">
            <FoodLogger
              currentCalories={currentCalories}
              targetCalories={targetCalories}
              onMealLogged={handleMealLogged}
              isLoading={isLLMLoading}
              setIsLoading={setIsLLMLoading}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard
              currentCalories={currentCalories}
              targetCalories={targetCalories}
              burnSuggestion={userGoal?.burnSuggestion}
              logs={dailyLogs}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

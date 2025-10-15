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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl shadow-lg animate-float" style={{ boxShadow: 'var(--shadow-glow-green)' }}>
                <Heart className="h-8 w-8 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Shakti
                </h1>
                <p className="text-xs text-primary">AI Health Planner</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
              <User className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">Guest User</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-muted/50 border border-border/50">
            <TabsTrigger value="goal" className="text-base data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              🎯 Goal
            </TabsTrigger>
            <TabsTrigger value="log" className="text-base data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary" disabled={!userGoal}>
              ✏️ Log Meal
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-base data-[state=active]:bg-accent/20 data-[state=active]:text-accent" disabled={!userGoal}>
              📊 Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="space-y-6">
            {userGoal ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl border border-primary/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Current Goal</h2>
                  <p className="text-lg mb-1">
                    <span className="font-semibold text-primary">{userGoal.goal}</span>
                  </p>
                  <p className="text-sm text-secondary">
                    {userGoal.currentWeight} kg → {userGoal.targetWeight} kg
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Daily Target: <span className="font-bold text-accent">{userGoal.dailyCalorieTarget} kcal</span>
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

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoalSetting from "@/components/GoalSetting";
import FoodLogger from "@/components/FoodLogger";
import Dashboard from "@/components/Dashboard";
import { Auth } from "@/components/Auth";
import { supabase } from "@/integrations/supabase/client";
import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingAnimation from "@/components/LoadingAnimation";

interface Goal {
  currentWeight: number;
  targetWeight: number;
  targetCalories: number;
  burnSuggestion?: string;
}

interface DailyLog {
  timestamp: number;
  text: string;
  calories: number;
  suggestion?: string;
}

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userGoal, setUserGoal] = useState<Goal | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("goal");

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadUserData();
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user) return;

    // Load user's goal
    const { data: goals } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (goals && goals.length > 0) {
      const goal = goals[0];
      setUserGoal({
        currentWeight: goal.current_weight,
        targetWeight: goal.target_weight,
        targetCalories: goal.target_calories,
        burnSuggestion: goal.burn_suggestion,
      });
    }

    // Load today's meal logs
    const today = new Date().toISOString().split("T")[0];
    const { data: logs } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("log_date", today)
      .order("logged_at", { ascending: true });

    if (logs) {
      setDailyLogs(
        logs.map((log) => ({
          timestamp: new Date(log.logged_at).getTime(),
          text: log.meal_text,
          calories: log.calories,
          suggestion: log.suggestion,
        }))
      );
    }
  };

  const handleGoalSet = async (goal: Goal) => {
    if (!session?.user) return;

    const { error } = await supabase.from("user_goals").insert({
      user_id: session.user.id,
      current_weight: goal.currentWeight,
      target_weight: goal.targetWeight,
      target_calories: goal.targetCalories,
      burn_suggestion: goal.burnSuggestion,
    });

    if (error) {
      toast.error("Failed to save goal");
      return;
    }

    setUserGoal(goal);
    setActiveTab("log");
    toast.success("Goal saved!");
  };

  const handleMealLogged = async (log: DailyLog) => {
    if (!session?.user) return;

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("meal_logs").insert({
      user_id: session.user.id,
      meal_text: log.text,
      calories: log.calories,
      suggestion: log.suggestion,
      log_date: today,
    });

    if (error) {
      toast.error("Failed to save meal");
      return;
    }

    setDailyLogs([...dailyLogs, log]);
    setActiveTab("dashboard");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserGoal(null);
    setDailyLogs([]);
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <LoadingAnimation />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const currentCalories = dailyLogs.reduce((sum, log) => sum + log.calories, 0);
  const targetCalories = userGoal?.targetCalories || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-card/50 backdrop-blur-md mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI Health Planner
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {session.user.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-muted/50 backdrop-blur-sm border border-border/50">
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
                <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl">Current Goal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">
                      Weight: <span className="font-bold text-secondary">{userGoal.currentWeight} kg</span> → <span className="font-bold text-primary">{userGoal.targetWeight} kg</span>
                    </p>
                    <p className="text-sm">
                      Daily Target: <span className="font-bold text-accent">{userGoal.targetCalories} kcal</span>
                    </p>
                  </CardContent>
                </Card>
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

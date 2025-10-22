import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoalSetting from "@/components/GoalSetting";
import FoodLogger from "@/components/FoodLogger";
import Dashboard from "@/components/Dashboard";
import { Auth } from "@/components/Auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingAnimation from "@/components/LoadingAnimation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getUserInitials } from "@/lib/avatarUtils";
import logoImage from "@/assets/logo.png";

interface Goal {
  id?: string;
  currentWeight: number;
  targetWeight: number;
  dailyCalorieTarget: number;
  burnSuggestion?: string;
}

interface DailyLog {
  timestamp: number;
  text: string;
  calories: number;
  suggestion?: string;
}

interface WeeklyData {
  date: string;
  calories: number;
}

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userGoal, setUserGoal] = useState<Goal | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
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
        id: goal.id,
        currentWeight: goal.current_weight,
        targetWeight: goal.target_weight,
        dailyCalorieTarget: goal.target_calories,
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

    // Load weekly data for the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split("T")[0];

    const { data: weeklyLogs } = await supabase
      .from("meal_logs")
      .select("log_date, calories")
      .eq("user_id", session.user.id)
      .gte("log_date", startDate)
      .order("log_date", { ascending: true });

    if (weeklyLogs) {
      // Group by date and sum calories
      const caloriesByDate = weeklyLogs.reduce((acc: Record<string, number>, log) => {
        acc[log.log_date] = (acc[log.log_date] || 0) + log.calories;
        return acc;
      }, {});

      // Create array for all 7 days (fill missing days with 0)
      const weekly: WeeklyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        weekly.push({
          date: dateStr,
          calories: caloriesByDate[dateStr] || 0,
        });
      }
      setWeeklyData(weekly);
    }
  };

  const handleGoalSet = async (goal: Goal) => {
    if (!session?.user) return;

    // Check if goal already exists
    if (userGoal) {
      toast.error("You already have a goal! Delete it first to create a new one.");
      return;
    }

    const { data, error } = await supabase.from("user_goals").insert({
      user_id: session.user.id,
      current_weight: goal.currentWeight,
      target_weight: goal.targetWeight,
      target_calories: goal.dailyCalorieTarget,
      burn_suggestion: goal.burnSuggestion,
    }).select().single();

    if (error) {
      toast.error("Failed to save goal");
      return;
    }

    setUserGoal({ ...goal, id: data.id });
    setActiveTab("log");
    toast.success("Goal saved!");
  };

  const handleDeleteGoal = async () => {
    if (!session?.user || !userGoal?.id) return;

    const { error } = await supabase
      .from("user_goals")
      .delete()
      .eq("id", userGoal.id);

    if (error) {
      toast.error("Failed to delete goal");
      return;
    }

    setUserGoal(null);
    setDailyLogs([]);
    toast.success("Goal and all meal logs deleted!");
  };

  const handleMealLogged = async (log: DailyLog) => {
    if (!session?.user || !userGoal?.id) return;

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("meal_logs").insert({
      user_id: session.user.id,
      goal_id: userGoal.id,
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
  const targetCalories = userGoal?.dailyCalorieTarget || 0;

  const avatarColor = session?.user?.id ? getAvatarColor(session.user.id) : 'hsl(142 76% 36%)';
  const userInitials = session?.user?.email ? getUserInitials(session.user.email) : '?';
  
  // Extract first name from email
  const getUserFirstName = (email: string): string => {
    const username = email.split('@')[0];
    // Remove numbers and special characters
    const cleanName = username.replace(/[0-9_.-]/g, '');
    // Capitalize first letter
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };
  
  const userFirstName = session?.user?.email ? getUserFirstName(session.user.email) : 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-card/95 backdrop-blur-xl mb-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={logoImage} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" style={{ filter: 'drop-shadow(0 0 8px hsl(0 84% 60%))' }} />
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent truncate">
                {userFirstName}'s Health
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Avatar 
                className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-offset-2 ring-offset-background transition-all"
                style={{ '--avatar-ring-color': avatarColor } as React.CSSProperties}
              >
                <AvatarFallback 
                  className="text-sm sm:text-base font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-12 sm:h-14 bg-card/80 backdrop-blur-md border border-border/30 shadow-lg">
            <TabsTrigger 
              value="goal" 
              className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
            >
              <span className="hidden sm:inline">🎯 Goal</span>
              <span className="sm:hidden">🎯</span>
            </TabsTrigger>
            <TabsTrigger 
              value="log" 
              className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-secondary/20 data-[state=active]:to-secondary/10 data-[state=active]:text-secondary data-[state=active]:shadow-[0_0_15px_hsl(var(--secondary)/0.3)]" 
              disabled={!userGoal}
            >
              <span className="hidden sm:inline">✏️ Log Meal</span>
              <span className="sm:hidden">✏️</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent/20 data-[state=active]:to-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-[0_0_15px_hsl(var(--accent)/0.3)]" 
              disabled={!userGoal}
            >
              <span className="hidden sm:inline">📊 Dashboard</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="space-y-4 sm:space-y-6">
            {userGoal ? (
              <div className="space-y-4 sm:space-y-6">
                <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm shadow-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between">
                    <CardTitle className="text-xl sm:text-2xl font-bold">Current Goal</CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteGoal}
                      className="gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete Goal</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3 relative">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-primary/20">
                      <span className="text-sm sm:text-base">Weight:</span>
                      <span className="font-bold text-secondary text-lg sm:text-xl">{userGoal.currentWeight} kg</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold text-primary text-lg sm:text-xl">{userGoal.targetWeight} kg</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20">
                      <span className="text-sm sm:text-base">Daily Target:</span>
                      <span className="font-bold text-accent text-lg sm:text-xl">{userGoal.dailyCalorieTarget} kcal</span>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground p-2 rounded-lg bg-muted/30 border border-muted">
                      ⚠️ Deleting your goal will remove all associated meal logs
                    </div>
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
              weeklyData={weeklyData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

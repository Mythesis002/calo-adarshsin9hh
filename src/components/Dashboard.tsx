import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, TrendingUp, Utensils, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line, LineChart, CartesianGrid } from "recharts";

interface DailyLog {
  timestamp: number;
  text: string;
  calories: number;
  suggestion?: string;
}

interface DashboardProps {
  currentCalories: number;
  targetCalories: number;
  burnSuggestion?: string;
  logs: DailyLog[];
}

const Dashboard = ({ currentCalories, targetCalories, burnSuggestion, logs }: DashboardProps) => {
  const progress = targetCalories > 0 ? (currentCalories / targetCalories) * 100 : 0;
  const remaining = Math.max(0, targetCalories - currentCalories);
  const isOnTrack = progress >= 90 && progress <= 110;
  const isOverTarget = progress > 110;

  // Calculate stats for graphs
  const totalMeals = logs.length;
  const avgCaloriesPerMeal = totalMeals > 0 ? Math.round(currentCalories / totalMeals) : 0;

  // Only show today's actual data
  const weeklyData = [
    { day: "Today", calories: currentCalories, target: targetCalories },
  ];

  // Meal distribution data
  const mealDistribution = logs.map((log, idx) => ({
    name: `Meal ${idx + 1}`,
    calories: log.calories,
  }));

  const chartConfig = {
    calories: {
      label: "Calories",
      color: "hsl(var(--ring-calories))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--primary))",
    },
  };

  // Circular progress component
  const CircularProgress = ({ value, max, color, label, size = 160 }: { value: number; max: number; color: string; label: string; size?: number }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center gap-3">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{value}</span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Activity Rings - Apple Fitness Style */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Today's Activity
          </CardTitle>
          <CardDescription>Track your daily nutrition goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            <CircularProgress
              value={currentCalories}
              max={targetCalories}
              color="hsl(var(--ring-move))"
              label="CALORIES"
            />
            <CircularProgress
              value={totalMeals}
              max={6}
              color="hsl(var(--ring-exercise))"
              label="MEALS"
            />
            <CircularProgress
              value={Math.round(progress)}
              max={100}
              color="hsl(var(--ring-stand))"
              label="GOAL %"
            />
          </div>

          <div className="mt-8 flex gap-4 flex-wrap justify-center">
            <Badge variant={isOnTrack ? "default" : "secondary"} className="text-base py-2 px-4 bg-primary/20 text-primary border-primary/30">
              {isOnTrack ? "🎯 Perfect!" : isOverTarget ? "⚠️ Over Target" : "📈 Keep Going!"}
            </Badge>
            {remaining > 0 && (
              <Badge variant="outline" className="text-base py-2 px-4 border-accent/30 text-accent">
                <Flame className="mr-2 h-4 w-4" />
                {remaining} kcal remaining
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend Graph */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Weekly Trend
          </CardTitle>
          <CardDescription>Your calorie intake over the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="hsl(var(--ring-calories))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--ring-calories))", r: 5 }}
                  activeDot={{ r: 7, fill: "hsl(var(--ring-calories))" }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Meal Distribution */}
      {mealDistribution.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Utensils className="h-5 w-5 text-accent" />
              Meal Breakdown
            </CardTitle>
            <CardDescription>Calories per meal today</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calories" fill="hsl(var(--ring-calories))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Average per meal: <span className="text-lg font-bold text-secondary">{avgCaloriesPerMeal} kcal</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Burn Suggestion Card */}
      {burnSuggestion && (
        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 via-card/50 to-accent/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-secondary">
              <Target className="h-5 w-5" />
              Your Fitness Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">{burnSuggestion}</p>
          </CardContent>
        </Card>
      )}

      {/* Latest Suggestion */}
      {logs.length > 0 && logs[logs.length - 1].suggestion && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-foreground/90">
              💡 {logs[logs.length - 1].suggestion}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Meal Log Card */}
      {logs.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Today's Meals
            </CardTitle>
            <CardDescription>{totalMeals} meals logged today</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm flex-1 text-foreground/90">{log.text}</p>
                      <Badge variant="secondary" className="shrink-0 bg-accent/20 text-accent border-accent/30">
                        {log.calories} kcal
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

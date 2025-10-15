import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, TrendingUp, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <div className="space-y-6">
      {/* Calorie Tracker Card */}
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Target className="h-6 w-6" />
            Today's Progress
          </CardTitle>
          <CardDescription>Track your daily calorie intake</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-bold text-2xl text-primary">{currentCalories} kcal</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-4" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-semibold">{targetCalories} kcal</span>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Badge variant={isOnTrack ? "default" : "secondary"} className="text-base py-2 px-4">
              {isOnTrack ? "🎯 Perfect!" : isOverTarget ? "⚠️ Over Target" : "📈 Keep Going!"}
            </Badge>
            {remaining > 0 && (
              <Badge variant="outline" className="text-base py-2 px-4">
                <Flame className="mr-2 h-4 w-4" />
                {remaining} kcal remaining
              </Badge>
            )}
          </div>

          {logs.length > 0 && logs[logs.length - 1].suggestion && (
            <div className="p-4 bg-secondary/20 rounded-lg border border-secondary">
              <p className="text-sm font-medium text-secondary-foreground">
                💡 {logs[logs.length - 1].suggestion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Burn Suggestion Card */}
      {burnSuggestion && (
        <Card className="shadow-lg bg-gradient-to-br from-accent/10 to-secondary/10 border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-accent">
              <TrendingUp className="h-5 w-5" />
              Your Fitness Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{burnSuggestion}</p>
          </CardContent>
        </Card>
      )}

      {/* Meal Log Card */}
      {logs.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Today's Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm flex-1">{log.text}</p>
                      <Badge variant="secondary" className="shrink-0">
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

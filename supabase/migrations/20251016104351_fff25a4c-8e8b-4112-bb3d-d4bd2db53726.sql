-- Create user_goals table to store weight and calorie targets
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_weight DECIMAL NOT NULL,
  target_weight DECIMAL NOT NULL,
  target_calories INTEGER NOT NULL,
  burn_suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_logs table to store all meals with dates
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_text TEXT NOT NULL,
  calories INTEGER NOT NULL,
  suggestion TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals"
ON public.user_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON public.user_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.user_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.user_goals FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for meal_logs
CREATE POLICY "Users can view their own meal logs"
ON public.meal_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs"
ON public.meal_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
ON public.meal_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
ON public.meal_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster date queries
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, log_date);
CREATE INDEX idx_user_goals_user ON public.user_goals(user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
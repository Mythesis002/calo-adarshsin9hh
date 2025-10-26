-- Enable realtime for meal_logs table
ALTER TABLE public.meal_logs REPLICA IDENTITY FULL;

-- Add meal_logs to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
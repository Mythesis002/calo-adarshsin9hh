-- Step 1: Delete old goals, keep only the latest one per user
DELETE FROM public.user_goals
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_goals
  ORDER BY user_id, created_at DESC
);

-- Step 2: Add goal_id column to meal_logs (nullable for now)
ALTER TABLE public.meal_logs 
ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.user_goals(id) ON DELETE CASCADE;

-- Step 3: Link existing meal logs to the user's current goal
UPDATE public.meal_logs ml
SET goal_id = (
  SELECT ug.id 
  FROM public.user_goals ug 
  WHERE ug.user_id = ml.user_id 
  LIMIT 1
)
WHERE ml.goal_id IS NULL;

-- Step 4: Delete any orphaned meal logs that couldn't be linked
DELETE FROM public.meal_logs WHERE goal_id IS NULL;

-- Step 5: Make goal_id required
ALTER TABLE public.meal_logs 
ALTER COLUMN goal_id SET NOT NULL;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_meal_logs_goal_id ON public.meal_logs(goal_id);

-- Step 7: Add unique constraint - one goal per user
ALTER TABLE public.user_goals 
ADD CONSTRAINT unique_user_goal UNIQUE (user_id);
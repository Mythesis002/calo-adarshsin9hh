import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, currentWeight, targetWeight } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const weightDifference = Math.abs(targetWeight - currentWeight);
    const isWeightLoss = targetWeight < currentWeight;
    
    const systemPrompt = `You are a specialized Indian Nutrition Planner and Fitness Coach. Your task is to calculate a daily calorie target based on the user's weight goals.

IMPORTANT CALCULATION RULES:
1. Base metabolic rate for average adult: ~1800-2200 kcal/day
2. To lose 1kg of body weight: need a deficit of ~7700 calories
3. Safe weight loss: 0.5-1kg per week (550-1100 kcal daily deficit)
4. Safe weight gain: 0.5kg per week (250-500 kcal daily surplus)

CALCULATION FORMULA:
- For weight loss: Start from 2000 kcal base
  * Small loss (1-3kg): 1600-1800 kcal/day (400-500 deficit)
  * Medium loss (3-7kg): 1400-1600 kcal/day (500-700 deficit)
  * Large loss (7kg+): 1300-1500 kcal/day (600-800 deficit)
  
- For weight gain: Start from 2000 kcal base
  * Small gain (1-3kg): 2300-2500 kcal/day (300-500 surplus)
  * Medium gain (3-7kg): 2500-2700 kcal/day (500-700 surplus)
  * Large gain (7kg+): 2700-3000 kcal/day (700-1000 surplus)

Provide culturally appropriate fitness suggestions (yoga, walking, cricket, home exercises, etc.).`;

    const userPrompt = `Goal: ${goal}
Current Weight: ${currentWeight} kg
Target Weight: ${targetWeight} kg
Weight Difference: ${weightDifference.toFixed(1)} kg
Direction: ${isWeightLoss ? 'Weight Loss' : 'Weight Gain'}

Calculate the appropriate daily calorie target based on the weight difference and provide fitness suggestions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "plan_nutrition",
            description: "Calculate daily calorie target and provide fitness suggestions",
            parameters: {
              type: "object",
              properties: {
                dailyCalorieTarget: {
                  type: "number",
                  description: "The recommended daily calorie intake in kcal"
                },
                burnSuggestion: {
                  type: "string",
                  description: "A short, encouraging paragraph (100-150 words) on how to achieve the goal through exercise and lifestyle changes, specific to Indian context"
                }
              },
              required: ["dailyCalorieTarget", "burnSuggestion"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "plan_nutrition" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in plan-goal function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

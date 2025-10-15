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
    const { mealDescription, currentCalories, targetCalories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in parsing natural language descriptions of Indian meals and estimating their calorie count. You must handle variations like 'extra roti,' 'less oil,' 'small bowl,' 'large serving' etc.

Be accurate for common Indian dishes:
- Dal, Sabzi (vegetables), Rice, Roti/Chapati, Paratha
- Poha, Idli, Dosa, Upma
- Chicken Curry, Fish Curry, Paneer dishes
- Samosa, Pakora, Namkeen
- Chai, Lassi, Juice, Shakes
- Sweets: Gulab Jamun, Jalebi, Barfi

Consider:
- Portion sizes (small/medium/large, number of pieces)
- Cooking methods (fried, steamed, less oil)
- Accompaniments (ghee, butter, oil quantity)

Provide realistic calorie estimates based on typical Indian portion sizes.`;

    const userPrompt = `Meal Description: "${mealDescription}"
Current day's calories: ${currentCalories} kcal
Daily target: ${targetCalories} kcal

Parse this meal and estimate calories. If the user is under target, provide a brief encouraging suggestion (max 15 words) on what they could add to reach their goal.`;

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
            name: "parse_meal",
            description: "Parse meal description and estimate calories",
            parameters: {
              type: "object",
              properties: {
                foodItem: {
                  type: "string",
                  description: "Normalized, clear description of the food logged"
                },
                estimatedCalories: {
                  type: "number",
                  description: "The estimated total calories for this meal entry"
                },
                completionSuggestion: {
                  type: "string",
                  description: "A brief suggestion (max 15 words) to help reach daily target, or congratulations if target met/exceeded"
                }
              },
              required: ["foodItem", "estimatedCalories", "completionSuggestion"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_meal" } }
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
    console.error('Error in parse-meal function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

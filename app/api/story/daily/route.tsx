import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth/server";
import { getDailyStoryData } from "@/lib/story";
import { getStoryTheme } from "@/lib/story-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const story = await getDailyStoryData(session.user.id);
  const theme = getStoryTheme(request);
  const weightText = story.weightChange == null
    ? "⚖️ Weight change: —"
    : `⚖️ Weight change: ${story.weightChange > 0 ? "+" : ""}${story.weightChange} kg`;

  return new ImageResponse(
    <div style={{width:1080,height:1920,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px 68px",background:theme.background,color:theme.text,fontFamily:"Arial, sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",gap:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",fontSize:36,fontWeight:800,color:theme.accent}}>PairFuel</div>
          <div style={{display:"flex",fontSize:24,padding:"10px 18px",border:`1px solid ${theme.line}`,borderRadius:999,color:theme.accent}}>Daily Progress</div>
        </div>
        <div style={{display:"flex",fontSize:78,fontWeight:900,lineHeight:1,letterSpacing:-2}}>{story.headline}</div>
        <div style={{display:"flex",fontSize:30,color:theme.muted}}>{story.displayName} · {story.dietPlanLabel}</div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:22}}>
        {[`🍽️ Calories: ${story.calories} / ${story.calorieTarget} kcal`,`🥩 Protein: ${story.protein} / ${story.proteinTarget} g`,`💧 Water: ${story.water} / ${story.waterTarget} ml`,`⏳ Fasting: ${story.fastingLabel}`,weightText].map((item)=><div key={item} style={{display:"flex",fontSize:42,padding:"28px 30px",borderRadius:28,background:theme.card,border:`1px solid ${theme.line}`}}>{item}</div>)}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:"flex",fontSize:36,fontWeight:800,color:theme.accent}}>Small steps, big progress ✨</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:24,color:theme.muted}}>
          <div style={{display:"flex"}}>pairfuel.vercel.app</div>
          <div style={{display:"flex"}}>© 2026 Elton Malumbot Production</div>
        </div>
      </div>
    </div>,
    { width:1080, height:1920 }
  );
}

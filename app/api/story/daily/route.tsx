import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth/server";
import { getDailyStoryData } from "@/lib/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const story = await getDailyStoryData(session.user.id);
  const weightText = story.weightChange == null
    ? "⚖️ Weight change: —"
    : `⚖️ Weight change: ${story.weightChange > 0 ? "+" : ""}${story.weightChange} kg`;

  return new ImageResponse(
    <div style={{width:1080,height:1920,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px 68px",background:"radial-gradient(circle at top right,#1d5a39 0%,#0f2419 35%,#07130e 100%)",color:"#f5fff8",fontFamily:"Arial, sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",gap:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",fontSize:36,fontWeight:800,color:"#c8ffd8"}}>PairFuel</div>
          <div style={{display:"flex",fontSize:24,padding:"10px 18px",border:"1px solid rgba(255,255,255,.16)",borderRadius:999,color:"#c8ffd8"}}>Daily Progress</div>
        </div>
        <div style={{display:"flex",fontSize:78,fontWeight:900,lineHeight:1,letterSpacing:-2}}>{story.headline}</div>
        <div style={{display:"flex",fontSize:30,color:"#a9c4b4"}}>{story.displayName} · {story.dietPlanLabel}</div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:22}}>
        {[`🍽️ Calories: ${story.calories} / ${story.calorieTarget} kcal`,`🥩 Protein: ${story.protein} / ${story.proteinTarget} g`,`💧 Water: ${story.water} / ${story.waterTarget} ml`,`⏳ Fasting: ${story.fastingLabel}`,weightText].map((item)=><div key={item} style={{display:"flex",fontSize:42,padding:"28px 30px",borderRadius:28,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.10)"}}>{item}</div>)}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:"flex",fontSize:36,fontWeight:800,color:"#c8ffd8"}}>Small steps, big progress ✨</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:24,color:"#a9c4b4"}}>
          <div style={{display:"flex"}}>pairfuel.vercel.app</div>
          <div style={{display:"flex"}}>© 2026 Elton Malumbot Production</div>
        </div>
      </div>
    </div>,
    { width:1080, height:1920 }
  );
}

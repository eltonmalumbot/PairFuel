import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth/server";
import { getTogetherStoryData } from "@/lib/story";
import { getStoryTheme } from "@/lib/story-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Palette = ReturnType<typeof getStoryTheme>;

function row(theme: Palette, label: string, value: string) {
  return <div style={{display:"flex",justifyContent:"space-between",gap:18,padding:"16px 0",borderBottom:`1px solid ${theme.line}`,fontSize:27}}><div style={{display:"flex",color:theme.muted}}>{label}</div><div style={{display:"flex",fontWeight:800}}>{value}</div></div>;
}

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const story = await getTogetherStoryData(session.user.id);
  const theme = getStoryTheme(request);

  if (!story.hasPartner || !story.partner) {
    return new ImageResponse(
      <div style={{width:1080,height:1920,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px 68px",background:theme.background,color:theme.text,fontFamily:"Arial, sans-serif"}}>
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{display:"flex",fontSize:36,fontWeight:800,color:theme.accent}}>PairFuel</div>
            <div style={{display:"flex",fontSize:24,padding:"10px 18px",border:`1px solid ${theme.line}`,borderRadius:999,color:theme.accent}}>Together Story</div>
          </div>
          <div style={{display:"flex",fontSize:80,fontWeight:900,lineHeight:1}}>Better Together 💑</div>
          <div style={{display:"flex",fontSize:32,color:theme.muted}}>{story.sharedMessage}</div>
        </div>
        <div style={{display:"flex",fontSize:42,padding:"30px",borderRadius:28,background:theme.card,border:`1px solid ${theme.line}`}}>Connect your partner first to unlock couple stats ✨</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:24,color:theme.muted}}><div style={{display:"flex"}}>pairfuel.vercel.app</div><div style={{display:"flex"}}>© 2026 Elton Malumbot Production</div></div>
      </div>,
      { width: 1080, height: 1920 },
    );
  }

  const partner = story.partner;
  return new ImageResponse(
    <div style={{width:1080,height:1920,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"64px 60px",background:theme.background,color:theme.text,fontFamily:"Arial, sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",fontSize:36,fontWeight:800,color:theme.accent}}>PairFuel</div>
          <div style={{display:"flex",fontSize:24,padding:"10px 18px",border:`1px solid ${theme.line}`,borderRadius:999,color:theme.accent}}>Together Story</div>
        </div>
        <div style={{display:"flex",fontSize:76,fontWeight:900,lineHeight:1}}>{story.headline}</div>
        <div style={{display:"flex",fontSize:30,color:theme.muted}}>{story.sharedMessage}</div>
      </div>

      <div style={{display:"flex",gap:24}}>
        <div style={{width:"50%",display:"flex",flexDirection:"column",padding:28,borderRadius:28,background:theme.card,border:`1px solid ${theme.line}`}}>
          <div style={{display:"flex",fontSize:32,fontWeight:900}}>Me</div>
          <div style={{display:"flex",fontSize:24,color:theme.muted,marginBottom:16}}>{story.me.displayName}</div>
          {row(theme, "🍽️ Calories", `${story.me.calories} / ${story.me.calorieTarget}`)}
          {row(theme, "🥩 Protein", `${story.me.protein} / ${story.me.proteinTarget} g`)}
          {row(theme, "💧 Water", `${story.me.water} / ${story.me.waterTarget} ml`)}
          {row(theme, "⏳ Fasting", story.me.fastingLabel)}
          {row(theme, "🔥 Status", story.me.onTrack ? "On Track" : "Keep Going")}
        </div>
        <div style={{width:"50%",display:"flex",flexDirection:"column",padding:28,borderRadius:28,background:theme.card,border:`1px solid ${theme.line}`}}>
          <div style={{display:"flex",fontSize:32,fontWeight:900}}>Partner</div>
          <div style={{display:"flex",fontSize:24,color:theme.muted,marginBottom:16}}>{partner.displayName}</div>
          {row(theme, "🍽️ Calories", partner.shareCalories ? `${partner.calories} / ${partner.calorieTarget}` : "Private 🔒")}
          {row(theme, "🥩 Protein", partner.shareMacros ? `${partner.protein} / ${partner.proteinTarget} g` : "Private 🔒")}
          {row(theme, "💧 Water", partner.shareWater ? `${partner.water} / ${partner.waterTarget} ml` : "Private 🔒")}
          {row(theme, "⏳ Fasting", partner.shareFasting ? (partner.fastingLabel || "—") : "Private 🔒")}
          {row(theme, "⚖️ Weight", partner.shareWeight && partner.weight !== undefined ? `${partner.weight} kg` : partner.shareWeightChange && partner.weightChange !== undefined ? `${partner.weightChange > 0 ? "+" : ""}${partner.weightChange} kg change` : "Private 🔒")}
          {row(theme, "❤️ Status", partner.onTrack === null ? "Private 🔒" : partner.onTrack ? "On Track" : "Keep Going")}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:"flex",fontSize:36,fontWeight:800,color:theme.accent}}>Better habits, better together ✨</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:24,color:theme.muted}}><div style={{display:"flex"}}>pairfuel.vercel.app</div><div style={{display:"flex"}}>© 2026 Elton Malumbot Production</div></div>
      </div>
    </div>,
    { width: 1080, height: 1920 },
  );
}

const MEME_QUOTES = [
  "Protein first. Bad decisions later. 🍗😌",
  "Drink water. Your kidneys are not interns. 💧🫡",
  "Calories count, but so does your sanity. 🧠🍕",
  "One cheat meal won’t ruin you. Relax, main character. 🎬🍔",
  "Your diet doesn’t need a villain arc today. 😈🥗",
  "Eat your protein. Your muscles have trust issues. 💪😂",
  "Hydrate before your body sends a strongly worded email. 💧📧",
  "Walking counts. Yes, even the dramatic walk to get coffee. 🚶☕",
  "Healthy food first. Emotional support snack can negotiate later. 🥗🤝🍪",
  "You don’t need motivation. You need lunch prepared. 🍱😅",
  "The scale is just data. Stop giving it CEO privileges. ⚖️💼",
  "Progress is progress, even if today’s workout was basically a side quest. 🎮🏃",
  "Vegetables are not punishment. Please stop looking at broccoli like that. 🥦👀",
  "Your body asked for water, not another iced coffee. Probably. 💧☕",
  "You can’t outsmart sleep deprivation with protein powder. 😴🥤",
  "Eat like someone who wants energy, not like a raccoon at 2 AM. 🦝🌙",
  "A 10-minute walk is still exercise. The fitness police are not coming. 🚶🚨",
  "Consistency is boring. Unfortunately, it also works. 😭✅",
  "Meal prep: because hungry-you has questionable leadership skills. 🍱🫠",
  "Your metabolism did not betray you. That second dessert was a team decision. 🍰🤝",
  "No need to restart Monday. Tuesday has Wi-Fi too. 📶😂",
  "You missed one workout, not your entire character development. 🏋️🎭",
  "Healthy lifestyle, but make it emotionally survivable. 🥗🫶",
  "Water first. Existential crisis second. 💧🌀",
  "Your goal is sustainable health, not becoming a boiled chicken influencer. 🍗📱",
  "Sleep is free recovery. Somehow we still try to negotiate with it. 😴🤡",
  "Carbs are not your ex. You don’t have to block them. 🍚📵",
  "Fiber: because your digestive system also deserves project management. 🌾📊",
  "Stretch a little. Your back has been filing complaints. 🧘📨",
  "Your steps count even when the destination is the fridge. 🚶🧊",
  "Eat slowly. The food is not trying to escape. 🍽️🏃",
  "Healthy habits are just boring hacks with excellent reviews. ⭐🥗",
  "Drink water before deciding you’re suddenly starving. 💧🍽️",
  "Your body is not a spreadsheet, but yes, the numbers can still help. 📊🫀",
  "Rest day means rest day. Stop trying to sneak in a punishment workout. 😴🏋️",
  "Protein is basically a subscription your muscles keep renewing. 💪🔁",
  "Meal planning is future-you sending present-you a care package. 🎁🍱",
  "Walking after meals: low-budget wellness, surprisingly good sequel. 🚶🎬",
  "Your healthy era can still include fries. This is not a monarchy. 🍟👑",
  "Broccoli did nothing wrong. Justice for broccoli. 🥦⚖️",
  "Hydration check: that one sip at noon was not a strategy. 💧😐",
  "If motivation is missing, use routine. Routine has terrible vibes but great attendance. 📅😂",
  "Your smartwatch is not disappointed in you. It is literally a rectangle. ⌚🫠",
  "Salad can have dressing. We are building health, not serving a sentence. 🥗🧑‍⚖️",
  "One extra cookie is not a plot twist. Carry on. 🍪📖",
  "Eat enough at lunch so 4 PM doesn’t become The Hunger Games. 🍱🏹",
  "Your water bottle did not come to work just for decoration. 💧🧴",
  "Going to bed on time is basically productivity in pajamas. 😴🛌",
  "Healthy choices are easier when the snacks stop holding board meetings in your pantry. 🍪📋",
  "Move your body. It has been in airplane mode too long. ✈️🕺",
  "Strength training: repeatedly picking things up until life feels lighter. 🏋️😌",
  "Do not fear the banana. It has never personally attacked your goals. 🍌😂",
  "Breakfast is not mandatory, but chaos at 11 AM is also a choice. 🥣😵",
  "Your body wants nutrients, not another motivational reel. 🥗📱",
  "Meal prep Sunday: the closest thing adults have to a cheat code. 🍱🎮",
  "Walk now, overthink later. 🚶🧠",
  "Sleep before your brain starts ordering snacks for emotional reasons. 😴🍿",
  "Hydration is skincare for your organs. Very exclusive spa. 💧✨",
  "Your calorie target is a guide, not a courtroom sentence. 🔢⚖️",
  "Add vegetables. Your plate needs supporting characters too. 🥕🎬",
  "Protein and fiber: the buddy-cop movie your appetite needed. 🍗🌾",
  "Your workout can be short. Netflix has trained you to accept episodes. 🏃📺",
  "Healthy doesn’t mean sad beige chicken forever. Please season your food. 🌶️🍗",
  "Your afternoon slump might be asking for water, sunlight, or a walk—not a resignation letter. ☀️💧🚶",
  "Eat the fruit. Nobody ever said, ‘That apple ruined everything.’ 🍎😂",
  "If the gym feels impossible, negotiate with yourself for ten minutes. Tiny treaty. 🤝🏋️",
  "Your goals are serious. Your lunch does not have to look serious. 🌯😎",
  "Drink water like your future headache is watching. 💧👀",
  "Rest is part of training. Your muscles are not doing unpaid overtime. 😴💪",
  "Food is fuel, joy, culture, and occasionally nachos at midnight. Balance. 🌮🌙",
  "Healthy habits are mostly doing normal things before they become emergencies. 😂✅",
  "Your next meal does not need to apologize for your last one. 🍽️🫶",
] as const;

const WHOLESOME_QUOTES = [
  "Small steps still move you forward. Keep going. 🌱💚",
  "Feed your body with care, not fear. 🥗🫶",
  "You deserve a healthy routine that still feels like a life. 🌤️❤️",
  "One imperfect day cannot erase weeks of consistency. 🌿✨",
  "Choose progress you can live with, not perfection you have to survive. 🌸🧘",
  "Your body deserves patience while your habits catch up with your goals. 🤍🌱",
  "Rest, water, food, movement—taking care of yourself counts. 💧🍎🚶😴",
  "Healthy progress can be quiet and still be real. 🌙✨",
  "Your next good choice matters more than your last messy one. 🌱➡️",
  "Build habits that make tomorrow easier. 🧱💚",
  "You are allowed to enjoy food while working toward your goals. 🍝🫶",
  "Movement is a celebration of what your body can do. 🚶💛",
  "Consistency is self-care repeated often enough to become a lifestyle. 🌿🔁",
  "Be proud of the habits nobody else sees. 🌙🏆",
  "Your health journey should give you more life, not less. 🌈💚",
  "Eat enough to feel strong, focused, and present. 🍽️✨",
  "A healthy routine should support your joy, not compete with it. 🌸😊",
  "Slow progress is still yours. Keep it. 🐢💚",
  "Your body is worth caring for at every stage, not just at the finish line. 🤍🏁",
  "Celebrate better energy, better sleep, and better habits too. ⚡😴🌱",
  "Keep returning to the basics. They are powerful because they work. 💧🥗🚶",
  "You can change your habits without being cruel to yourself. 🫶🌿",
  "Today does not need to be perfect to be meaningful. ☀️💛",
  "Healthy choices become easier when they come from care. 🌱❤️",
  "Take your time. Sustainable change is allowed to be gentle. 🌸⏳",
  "Your future self is built by ordinary choices made with intention. 🌅✨",
  "Make room for nourishment, movement, rest, and joy. 🍎🚶😴🎉",
  "Your goals deserve consistency, and you deserve kindness. 🎯🤍",
  "Keep showing up for yourself in small, repeatable ways. 🌱🔁",
  "A healthier life is not one big decision—it is many kind ones. 💚✨",
] as const;

const SAVAGE_QUOTES = [
  "Your goals cannot eat the meal you forgot to plan. Be serious. 😭🍱",
  "‘I’ll start tomorrow’ has had enough seasons. Cancel the show. 📺✋",
  "Your water bottle is full. You are the bottleneck. 💧💀",
  "If you have time to doomscroll, you have time for a ten-minute walk. 📱🚶",
  "Stop waiting to feel motivated. Motivation is clearly on annual leave. 🏖️😂",
  "Your sleep schedule is not mysterious. You are on your phone at 1 AM. 📱🌙",
  "Buying healthy groceries is not the workout. Nice try. 🛒🏋️",
  "Your fitness tracker cannot walk the steps for you, bestie. ⌚🚶",
  "That ‘tiny snack’ has had three sequels. We saw the franchise. 🍪🎬",
  "You do not need a detox. You need water, vegetables, and fewer dramatic decisions. 💧🥦😌",
  "Your plan is not failing. You keep ghosting it. 👻📋",
  "Meal prep looked boring until hungry-you started making financial decisions. 🍔💸",
  "You cannot call it hydration if the water bottle is still decorative. 🧴👀",
  "Your body needs sleep, not another episode you barely remember. 😴📺",
  "Stop negotiating with the workout like it owes you money. Ten minutes. Go. 🏃💸",
  "One bad day is normal. Turning it into a bad month is a creative choice. 📆😬",
  "You asked for progress, not daily proof that gravity likes you. Get off the scale. ⚖️😂",
  "Future-you keeps receiving problems present-you could solve with a packed lunch. 🍱📦",
] as const;

const QUOTES = [...MEME_QUOTES, ...WHOLESOME_QUOTES, ...SAVAGE_QUOTES] as const;

function jakartaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function quoteIndex(dateKey: string) {
  let hash = 2166136261;
  for (const char of dateKey) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % QUOTES.length;
}

export default function DailyQuote() {
  const quote = QUOTES[quoteIndex(jakartaDateKey())];

  return (
    <div className="daily-quote" aria-label="Daily healthy lifestyle quote">
      <span className="daily-quote-mark" aria-hidden="true">“</span>
      <span>{quote}</span>
    </div>
  );
}

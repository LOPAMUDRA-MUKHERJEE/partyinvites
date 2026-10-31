'use server'

import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const MODEL = 'gemini-2.5-flash-lite'
const DAILY_LIMIT = 10

const TONES = ['funny', 'traditional', 'family'] as const
type Tone = (typeof TONES)[number]

const FALLBACKS: Record<Tone, string> = {
  funny:
    "Diwali is coming and so is the food. Come over, eat far too many sweets, and we'll all pretend the diet starts next week.",
  traditional:
    "We are celebrating Diwali with a small puja and dinner at home, and it would mean a lot to have you with us. Come and share the lights and the sweets.",
  family:
    "We're getting everyone together for Diwali and it won't feel right without you. Come early, stay as long as you like.",
}

const TONE_HINTS: Record<Tone, string> = {
  funny: 'funny and teasing, with a light joke about food or sweets',
  traditional: 'warm and respectful, mentioning puja or blessings',
  family: 'cosy and informal, like inviting close family',
}

type Result = { message: string; usedFallback: boolean; note?: string }

async function askGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('GEMINI_API_KEY is missing')
    return null
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
        }),
        signal: controller.signal,
      }
    )
    if (!res.ok) {
      console.error('Gemini error', res.status, (await res.text()).slice(0, 300))
      return null
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return typeof text === 'string' ? text : null
  } catch (e) {
    console.error('Gemini call failed', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function writeInviteMessage(tone: string, hostName: string): Promise<Result> {
  const safeTone: Tone = (TONES as readonly string[]).includes(tone) ? (tone as Tone) : 'traditional'
  const fallback = FALLBACKS[safeTone]

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: fallback, usedFallback: true, note: 'Please log in again.' }
  }

  // daily limit per host
  const admin = getAdminSupabase()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) {
    return {
      message: fallback,
      usedFallback: true,
      note: 'Daily AI limit reached, so this is a ready-made message.',
    }
  }
  // count the attempt before calling, so failed calls also count
  await admin.from('ai_usage').insert({ user_id: user.id })

  const host = hostName.replace(/[\r\n]+/g, ' ').trim().slice(0, 60) || 'the host'
  const prompt =
    `Write the middle part of a Diwali party invitation from ${host} to a friend or relative. ` +
    `Tone: ${TONE_HINTS[safeTone]}. ` +
    `Rules: 2 to 3 short sentences, plain everyday words, like a real person texting. ` +
    `No emojis, no hashtags, no greeting (the email already says Hi and the name), no sign-off, ` +
    `no date, time or place (added separately). ` +
    `Avoid cliches like "join us for an evening of", "festival of lights", "radiance". ` +
    `Output only the message text.`

  const raw = await askGemini(prompt)
  const cleaned = raw ? raw.trim().replace(/^["']|["']$/g, '').slice(0, 600) : ''
  if (!cleaned) {
    return {
      message: fallback,
      usedFallback: true,
      note: 'AI was not available, so this is a ready-made message.',
    }
  }
  return { message: cleaned, usedFallback: false }
}
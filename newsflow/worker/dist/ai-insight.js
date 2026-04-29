import Anthropic from '@anthropic-ai/sdk';
let client = null;
function getClient() {
    if (!process.env.ANTHROPIC_API_KEY)
        return null;
    if (!client)
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return client;
}
const PROMPT = (headline, excerpt) => `In 1–2 sentences, explain why this news matters to a tech-savvy product manager or developer. Be direct. No preamble.\n\nHeadline: ${headline}\nExcerpt: ${excerpt}`;
export async function generateInsight(headline, excerpt) {
    const ai = getClient();
    if (!ai)
        return null; // Graceful skip when API key is absent
    try {
        const msg = await ai.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [
                {
                    role: 'user',
                    content: PROMPT(headline, excerpt ?? 'No excerpt available.'),
                },
            ],
        });
        const block = msg.content[0];
        return block.type === 'text' ? block.text.trim() : null;
    }
    catch (err) {
        console.warn('AI insight generation failed:', err.message);
        return null;
    }
}

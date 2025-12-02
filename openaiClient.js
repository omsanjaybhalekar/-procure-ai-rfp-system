// minimal OpenAI wrapper using fetch to call Chat Completions (adjust per provider)
const fetch = require('node-fetch');
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(messages, model = "gpt-4o-mini") {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set in env");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 800,
      temperature: 0.0
    })
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data));
  // return assistant text
  return data.choices?.[0]?.message?.content || "";
}

module.exports = { callOpenAI };

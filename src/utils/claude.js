import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const MODEL_ID = 'us.anthropic.claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are a Strudel music pattern generator.
Output ONLY a single line of valid Strudel code. No explanation, no markdown.

AVAILABLE SOUNDS — use no others:
  Drums  (s()): bd sd hh ho cp mt ht lt rim cb
  Samples (s()): arpy pluck bass moog juno gtr jazz sitar
  Synths (note().s()): sawtooth square triangle sine supersaw pulse

RULES:
- Do NOT use .bank() .voicings() or .play()
- For piano sounds use arpy or pluck (NOT "piano" — it is not in the sample pack)
- Do NOT add .gain() .lpf() .room() .delay() .orbit() — added by the app
- For chords use bracket notation: note("[c3,e3,g3]") never voicings()

Examples:
  s("bd sd hh bd")
  s("bd*2 sd [hh hh] sd").fast(2)
  s("<bd cp> hh sd ho")
  note("<c3 e3 g3 b3>(3,8)").s("sawtooth")
  note("<c2 a2 f2 g2>").s("supersaw")
  note("<[c3,e3,g3] [a2,c3,e3] [f2,a2,c3] [g2,b2,d3]>").s("arpy")
  note("<c4 e4 g4>(3,8)").s("moog")
  s("arpy").n("<0 2 4 7>")`

function createClient() {
  const credentials = {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  }
  if (import.meta.env.VITE_AWS_SESSION_TOKEN) {
    credentials.sessionToken = import.meta.env.VITE_AWS_SESSION_TOKEN
  }
  return new BedrockRuntimeClient({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials,
  })
}

export async function generatePattern(description) {
  const client = createClient()
  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: description }] }],
    inferenceConfig: { maxTokens: 256 },
  })
  const response = await client.send(command)
  return response.output.message.content[0].text.trim()
}

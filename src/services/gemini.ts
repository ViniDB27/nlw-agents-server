import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY
})

const model = 'gemini-2.5-flash'

export async function transcribeAudio(audiosAsBase64: string, mintypemietype: string) {
  const reponse = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: 'Transcreva o áudio para português do Brasil. Seja preciso e natural na transcrição. Mantenha a pontuação adequada e divida o texto em parágrafos quando for apropriado.'
      },
      {
        inlineData: {
          mimeType: mintypemietype,
          data: audiosAsBase64
        }
      }
    ]
  })

  if (!reponse.text) {
    throw new Error('Não foi possível transcrever o áudio com o Gemini.')
  }
  return reponse.text
}

export async function generateEmbeddings(text: string) {
  const reponse = await gemini.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ text }],
    config: {
      taskType: 'RETRIEVAL_DOCUMENT'
    }
  })

  if (!reponse.embeddings?.[0].values) {
    throw new Error('Não foi possível gerar embeddings com o Gemini.')
  }

  return reponse.embeddings[0].values
}

export async function generateAnswer(question: string, transcriptions: string[]) {
  const context = transcriptions.join('\n\n')
  const prompt = `
    Com base no texto fornecido abaixo como contexto, reponda a pergunta de forma clara e precisa. em português do Brasil.
    CONTEXTO: 
    ${context}
    
    PERGUNTA:
    ${question}
    
    INSTRUÇÕES:
    - Use apenas informações contidas no contexto enviado;
    - Se a resposta não for encontrada no contexto, apensa responda que não foi possível encontrar a resposta;
    - Seja objetivo e claro na resposta;
    - Mantenha um tom educado e profissional;
    - Cite trechos relevantes do contexto se apropriado;
    - Se for citar o contexto, utilize o termo "conteúdo da aula";
  `.trim()
  const reponse = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: prompt
      }
    ]
  })

  if (!reponse.text) {
    throw new Error('Não foi possível gerar uma resposta com o Gemini.')
  }

  return reponse.text
}
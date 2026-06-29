interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function askGemini(
  apiKey: string,
  history: { sender: 'user' | 'bot'; text: string }[],
  systemInstruction: string,
  latestMessage: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API түлхүүр оруулна уу.');
  }

  // Convert chat history format to Gemini API format
  const contents: Message[] = [];
  
  history.forEach((msg) => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  // Append latest message
  contents.push({
    role: 'user',
    parts: [{ text: latestMessage }]
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP алдаа: ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('Хариулт олдсонгүй. API түлхүүр эсвэл сүлжээгээ шалгана уу.');
    }

    return reply;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Gemini рүү холбогдоход алдаа гарлаа.');
  }
}

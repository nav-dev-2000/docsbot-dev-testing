import { getPrompts } from "@/lib/tools"


export default async function handler(req, res) {
if (req.method === 'GET') {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ message: 'Missing query parameter' })
    }

    try {
      const prompts = await getPrompts('prompt', null, null, 10000)

      const filteredPrompts = prompts.filter(prompt => {  
        return prompt.name.toLowerCase().includes(query.toLowerCase()) ||
               prompt.short_description.toLowerCase().includes(query.toLowerCase())
      })

      return res.status(200).json(filteredPrompts)
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: `Failed to search prompts: ${e}` })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

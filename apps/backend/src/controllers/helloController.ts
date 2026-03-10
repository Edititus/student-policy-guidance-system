import { Request, Response } from 'express'
import { HelloResponseSchema } from '@ai-student-policy/shared-types'
import { HelloService, IHelloService } from '../services/helloService'

const helloService: IHelloService = new HelloService()

export const helloHandler = async (_req: Request, res: Response) => {
  try {
    const payload = await helloService.getHelloMessage()
    // Validate at the boundary
    const parsed = HelloResponseSchema.safeParse(payload)
    if (!parsed.success) {
      return res.status(500).json({ error: 'Invalid response shape' })
    }
    return res.json(parsed.data)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

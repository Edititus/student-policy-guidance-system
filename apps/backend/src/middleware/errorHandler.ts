import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  status?: number
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err)
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'
  res.status(status).json({ error: message })
}

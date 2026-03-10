import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateToken } from '../controllers/authControllerDb';

// Use generic interface to avoid type conflicts between Policy.ts and databaseRagService.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createChatRoutes(ragService: any): Router {
  const router = Router();
  const chatController = new ChatController(ragService);

  router.post('/query', authenticateToken, chatController.askQuestion);
  router.post('/query/stream', authenticateToken, chatController.askQuestionStream);
  router.get('/history', authenticateToken, chatController.getHistory);
  router.get('/conversations', authenticateToken, chatController.getConversations);
  router.get('/resolution/:queryId', authenticateToken, chatController.getQueryResolution);
  router.get('/stats', authenticateToken, chatController.getStats);
  router.get('/categories', authenticateToken, chatController.getCategories);
  router.post('/feedback', authenticateToken, chatController.submitFeedback);

  return router;
}

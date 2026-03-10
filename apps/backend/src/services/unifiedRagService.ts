import { v4 as uuidv4 } from 'uuid';
import { IRAGService } from './IRAGService';
import { RAGService } from './ragService';
import { PolicyDocument, PolicyQuery, PolicyResponse } from '../models/Policy';

/**
 * UnifiedRAGService keeps the previous app contract while allowing
 * startup without mandatory external AI credentials in local/dev setups.
 */
export class UnifiedRAGService implements IRAGService {
  private ragService: RAGService | null = null;
  private policyCount = 0;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.ragService = new RAGService(apiKey);
    }
  }

  async answerQuery(query: PolicyQuery): Promise<PolicyResponse> {
    if (this.ragService) {
      return this.ragService.answerQuery(query);
    }

    return {
      id: uuidv4(),
      queryId: query.id,
      answer:
        'AI provider is not configured in this environment. Please contact an administrator.',
      confidence: 'LOW',
      sources: [],
      reasoning: 'No AI provider configured',
      escalated: true,
      timestamp: new Date(),
    };
  }

  async addPolicy(policy: PolicyDocument): Promise<void> {
    this.policyCount += 1;
    if (this.ragService) {
      await this.ragService.addPolicy(policy);
    }
  }

  async loadPolicies(policies: PolicyDocument[]): Promise<void> {
    for (const policy of policies) {
      await this.addPolicy(policy);
    }
  }

  getStats(): {
    totalPolicies: number;
    totalChunks: number;
    embeddingModel: string;
    generationModel?: string;
    embeddingDimension: number;
  } {
    if (this.ragService) {
      const stats = this.ragService.getStats();
      return {
        totalPolicies: stats.policies,
        totalChunks: stats.embeddings,
        embeddingModel: 'text-embedding-3-small',
        generationModel: 'gpt-4o-mini',
        embeddingDimension: 1536,
      };
    }

    return {
      totalPolicies: this.policyCount,
      totalChunks: 0,
      embeddingModel: 'none',
      generationModel: 'none',
      embeddingDimension: 0,
    };
  }
}

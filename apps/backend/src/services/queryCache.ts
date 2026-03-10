import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  insertedAt: number;
}

// ─── Generic LRU Map ──────────────────────────────────────────────────────────

/**
 * A simple LRU-like cache backed by a Map.
 * Insertion order = access order.  When capacity is exceeded the oldest
 * entry (first key in iteration order) is evicted.
 */
class LRUCache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number,
  ) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.insertedAt > this.ttlMs) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU position
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    if (this.store.size >= this.maxSize) {
      // Evict the oldest entry (first in insertion order)
      this.store.delete(this.store.keys().next().value!);
    }
    this.store.set(key, { value, insertedAt: Date.now() });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  get size(): number {
    return this.store.size;
  }
}

// ─── Cache instances ──────────────────────────────────────────────────────────

/** Embedding vectors keyed by the raw query string.  ~500 entries × 384 floats × 4 bytes ≈ 768 KB */
const embeddingCache = new LRUCache<string, number[]>(500, 10 * 60 * 1000); // 10 min TTL

/** Full answer payloads keyed by SHA-256 of (normalised query + schoolId).  60 min TTL */
interface CachedAnswer {
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: Array<{
    policyId: string | number;
    policyTitle: string;
    excerpt: string;
    similarity?: number;
    pageReference?: string;
  }>;
  requiresEscalation: boolean;
}
const answerCache = new LRUCache<string, CachedAnswer>(200, 60 * 60 * 1000); // 60 min TTL

/** Policy title list keyed by schoolId.  Prevents repeated DB lookups after every query.  5 min TTL */
const policyTitleCache = new LRUCache<string, Map<number, string>>(50, 5 * 60 * 1000); // 5 min TTL

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseQuery(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function answerKey(query: string, schoolId: string | undefined): string {
  return crypto
    .createHash('sha256')
    .update(`${normaliseQuery(query)}::${schoolId ?? ''}`)
    .digest('hex')
    .slice(0, 16); // 8-byte prefix — collision probability negligible at 200 entries
}

// ─── Public API ───────────────────────────────────────────────────────────────

// -- Embedding cache --

export function getCachedEmbedding(query: string): number[] | undefined {
  return embeddingCache.get(normaliseQuery(query));
}

export function setCachedEmbedding(query: string, vector: number[]): void {
  embeddingCache.set(normaliseQuery(query), vector);
}

// -- Answer cache --

export function getCachedAnswer(
  query: string,
  schoolId: string | undefined,
): CachedAnswer | undefined {
  return answerCache.get(answerKey(query, schoolId));
}

export function setCachedAnswer(
  query: string,
  schoolId: string | undefined,
  payload: CachedAnswer,
): void {
  answerCache.set(answerKey(query, schoolId), payload);
}

// -- Policy title cache --

export function getCachedPolicyTitles(schoolId: string): Map<number, string> | undefined {
  return policyTitleCache.get(schoolId);
}

export function setCachedPolicyTitles(schoolId: string, titles: Map<number, string>): void {
  policyTitleCache.set(schoolId, titles);
}

/** Clear a school's policy title cache (call after admin uploads/deletes a policy). */
export function invalidatePolicyTitleCache(schoolId: string): void {
  policyTitleCache.delete(schoolId);
}

// ─── Diagnostics (admin / health endpoint) ───────────────────────────────────

export function getCacheStats() {
  return {
    embeddings: embeddingCache.size,
    answers: answerCache.size,
    policyTitles: policyTitleCache.size,
  };
}

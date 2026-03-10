/**
 * Escalated Queries Page
 * Full escalation management: respond, dismiss, delete, filter by status
 */

import React, { useState, useMemo } from 'react';
import type { IEscalatedQuery } from '../../types';
import { Card, Badge, Button, Icon, Spinner } from '../../components/atoms';

type FilterTab = 'all' | 'pending' | 'responded' | 'dismissed';

type ModalMode =
  | { type: 'respond'; query: IEscalatedQuery }
  | { type: 'view'; query: IEscalatedQuery }
  | { type: 'dismiss'; query: IEscalatedQuery }
  | { type: 'delete'; query: IEscalatedQuery }
  | null;

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Pending',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  icon: 'exclamation-circle' },
  in_review: { label: 'In Review',  color: 'bg-blue-50 text-blue-700 border-blue-200',        icon: 'info-circle' },
  resolved:  { label: 'Responded',  color: 'bg-green-50 text-green-700 border-green-200',     icon: 'check-filled' },
  dismissed: { label: 'Dismissed',  color: 'bg-gray-100 text-slate border-gray-200',          icon: 'close' },
};

function getStatus(q: IEscalatedQuery): string {
  if (q.escalationStatus) return q.escalationStatus;
  if (q.responded) return 'resolved';
  return 'pending';
}

interface IQueriesPageProps {
  queries: IEscalatedQuery[];
  isLoading?: boolean;
  onRespond: (queryId: string, response: string) => Promise<void>;
  onDismiss: (queryId: string) => Promise<void>;
  onDelete: (queryId: string) => Promise<void>;
  isResponding?: boolean;
  isDismissing?: boolean;
  isDeleting?: boolean;
}

const QueriesPage: React.FC<IQueriesPageProps> = ({
  queries,
  isLoading = false,
  onRespond,
  onDismiss,
  onDelete,
  isResponding = false,
  isDismissing = false,
  isDeleting = false,
}) => {
  const [modal, setModal] = useState<ModalMode>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all:       queries.length,
    pending:   queries.filter((q) => getStatus(q) === 'pending' || getStatus(q) === 'in_review').length,
    responded: queries.filter((q) => getStatus(q) === 'resolved').length,
    dismissed: queries.filter((q) => getStatus(q) === 'dismissed').length,
  }), [queries]);

  const filtered = useMemo(() => {
    const byTab = queries.filter((q) => {
      const s = getStatus(q);
      if (activeTab === 'all')       return true;
      if (activeTab === 'pending')   return s === 'pending' || s === 'in_review';
      if (activeTab === 'responded') return s === 'resolved';
      if (activeTab === 'dismissed') return s === 'dismissed';
      return true;
    });
    if (!search.trim()) return byTab;
    const lower = search.toLowerCase();
    return byTab.filter(
      (q) =>
        q.queryText.toLowerCase().includes(lower) ||
        q.studentName?.toLowerCase().includes(lower) ||
        q.studentEmail?.toLowerCase().includes(lower)
    );
  }, [queries, activeTab, search]);

  const closeModal = () => { setModal(null); setAdminResponse(''); };

  const handleRespond = async () => {
    if (modal?.type !== 'respond' || !adminResponse.trim()) return;
    setActionLoading(modal.query.queryId);
    try { await onRespond(modal.query.queryId, adminResponse); closeModal(); }
    catch { alert('Failed to send response'); }
    finally { setActionLoading(null); }
  };

  const handleDismiss = async () => {
    if (modal?.type !== 'dismiss') return;
    setActionLoading(modal.query.queryId);
    try { await onDismiss(modal.query.queryId); closeModal(); }
    catch { alert('Failed to dismiss query'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (modal?.type !== 'delete') return;
    setActionLoading(modal.query.queryId);
    try { await onDelete(modal.query.queryId); closeModal(); }
    catch { alert('Failed to delete query'); }
    finally { setActionLoading(null); }
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'pending',   label: 'Pending' },
    { key: 'responded', label: 'Responded' },
    { key: 'dismissed', label: 'Dismissed' },
    { key: 'all',       label: 'All' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label="Loading queries..." />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-teal-deep">Escalated Queries</h2>
            <p className="text-sm text-slate mt-0.5">Queries flagged for admin review due to low AI confidence</p>
          </div>
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries or students…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-primary w-64"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-smoke rounded-xl p-1 w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === key ? 'bg-white text-teal-deep shadow-sm' : 'text-slate hover:text-teal-deep'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === key ? 'bg-teal-mist text-teal-deep' : 'bg-gray-200 text-slate'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Query list */}
        <Card variant="outlined" padding="none">
          <div className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="check" size={28} className="text-green-500" />
                </div>
                <div className="text-base font-medium text-teal-deep">
                  {search ? 'No results match your search' : `No ${activeTab === 'all' ? '' : activeTab} queries`}
                </div>
                {activeTab === 'pending' && !search && (
                  <div className="text-sm text-slate mt-1">All escalated queries have been handled!</div>
                )}
              </div>
            ) : (
              filtered.map((query) => {
                const status = getStatus(query);
                const sm = STATUS_META[status] || STATUS_META.pending;
                return (
                  <div key={query.id} className="p-5 hover:bg-smoke/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Row: badges + timestamp */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={query.confidence === 'LOW' ? 'low' : 'medium'} size="sm">
                            {query.confidence}
                          </Badge>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${sm.color}`}>
                            <Icon name={sm.icon as Parameters<typeof Icon>[0]['name']} size={11} />
                            {sm.label}
                          </span>
                          {query.studentName && (
                            <span className="text-xs text-slate flex items-center gap-1">
                              <Icon name="user" size={11} />{query.studentName}
                            </span>
                          )}
                          <span className="text-xs text-slate/60 ml-auto">
                            {new Date(query.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {/* Question */}
                        <p className="text-sm font-semibold text-teal-deep mb-2 leading-snug">
                          "{query.queryText}"
                        </p>
                        {/* AI answer */}
                        <p className="text-xs text-slate bg-smoke rounded-lg px-3 py-2 line-clamp-2 mb-2">
                          <span className="font-medium text-teal-deep">AI: </span>{query.aiAnswer}
                        </p>
                        {/* Admin response (responded only) */}
                        {status === 'resolved' && query.adminResponse && (
                          <p className="text-xs text-teal-deep bg-teal-mist/40 rounded-lg px-3 py-2 line-clamp-2 border border-teal-bright/30">
                            <span className="font-medium">Admin: </span>{query.adminResponse}
                          </p>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {(status === 'pending' || status === 'in_review') ? (
                          <>
                            <Button variant="primary" size="sm" onClick={() => setModal({ type: 'respond', query })}>
                              Respond
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setModal({ type: 'dismiss', query })}>
                              Dismiss
                            </Button>
                          </>
                        ) : status === 'resolved' ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setModal({ type: 'view', query })}>
                              View
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setModal({ type: 'delete', query })}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setModal({ type: 'delete', query })}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ── Respond Modal ── */}
      {modal?.type === 'respond' && (
        <div className="fixed inset-0 bg-teal-deep/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-teal-deep">Respond to Query</h3>
              <button onClick={closeModal} className="p-2 hover:bg-smoke rounded-lg transition-colors">
                <Icon name="close" size={20} className="text-slate" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {modal.query.studentName && (
                <p className="text-xs text-slate flex items-center gap-1">
                  <Icon name="user" size={13} />
                  <span className="font-medium">{modal.query.studentName}</span>
                  {modal.query.studentEmail && <span className="text-slate/60">· {modal.query.studentEmail}</span>}
                </p>
              )}
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-1.5">Student's Question</label>
                <div className="p-3 bg-smoke rounded-xl text-sm text-teal-deep">{modal.query.queryText}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-1.5">AI's Attempted Answer</label>
                <div className="p-3 bg-red-50 rounded-xl text-sm text-teal-deep border border-red-100">{modal.query.aiAnswer}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-1.5">Your Correct Answer</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Provide the accurate, complete answer to this query…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary resize-none transition-all text-sm"
                  rows={6}
                  autoFocus
                />
                <p className="text-xs text-slate/60 mt-1">
                  This response will be emailed to the student and embedded in the AI knowledge base.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleRespond}
                isLoading={isResponding || actionLoading === modal.query.queryId}
                disabled={!adminResponse.trim()}
              >
                Send Response
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Response Modal ── */}
      {modal?.type === 'view' && (
        <div className="fixed inset-0 bg-teal-deep/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-teal-deep">Query Resolution</h3>
              <button onClick={closeModal} className="p-2 hover:bg-smoke rounded-lg transition-colors">
                <Icon name="close" size={20} className="text-slate" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate block mb-1.5">Student's Question</label>
                <div className="p-3 bg-smoke rounded-xl text-sm text-teal-deep">{modal.query.queryText}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate block mb-1.5">Admin Response</label>
                <div className="p-3 bg-teal-mist/40 rounded-xl text-sm text-teal-deep border border-teal-bright/30 whitespace-pre-wrap">
                  {modal.query.adminResponse || '—'}
                </div>
              </div>
              {modal.query.respondedAt && (
                <p className="text-xs text-slate/60">Responded {new Date(modal.query.respondedAt).toLocaleString()}</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dismiss Confirmation ── */}
      {modal?.type === 'dismiss' && (
        <div className="fixed inset-0 bg-teal-deep/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center shrink-0">
                <Icon name="exclamation-circle" size={22} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-teal-deep">Dismiss this query?</h3>
                <p className="text-sm text-slate mt-1">
                  The query will be marked as dismissed. The student will <strong>not</strong> receive a response. You can still delete it afterwards.
                </p>
              </div>
            </div>
            <div className="p-3 bg-smoke rounded-xl text-sm text-teal-deep mb-5 line-clamp-3">
              "{modal.query.queryText}"
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleDismiss}
                isLoading={isDismissing || actionLoading === modal.query.queryId}
                className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
              >
                Yes, Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {modal?.type === 'delete' && (
        <div className="fixed inset-0 bg-teal-deep/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <Icon name="warning-filled" size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-teal-deep">Delete this query?</h3>
                <p className="text-sm text-slate mt-1">
                  This will <strong>permanently remove</strong> the record. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="p-3 bg-smoke rounded-xl text-sm text-teal-deep mb-5 line-clamp-3">
              "{modal.query.queryText}"
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                isLoading={isDeleting || actionLoading === modal.query.queryId}
                className="bg-red-500 hover:bg-red-600 border-red-500"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QueriesPage;

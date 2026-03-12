/**
 * Policies Page
 * Display and manage policy library
 */

import React, { useState } from 'react'
import type { IPolicy } from '../../types'
import { Card, Badge, Button, Spinner, Icon, Input } from '../../components/atoms'

export interface UploadStatus {
  progress: number
  stage: 'idle' | 'uploading' | 'parsing' | 'processing' | 'complete' | 'error'
  message: string
  fileName?: string
}

export interface CoverageGap {
  intent: string
  sampleQuery: string
  count: number
}

interface IPoliciesPageProps {
  policies: IPolicy[]
  isLoading?: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onActivatePolicy: (policyId: number) => Promise<void>
  onDeactivatePolicy?: (policyId: number) => Promise<void>
  onUpdatePolicy?: (policyId: number, data: { title?: string; category?: string }) => Promise<void>
  onDeletePolicy?: (policyId: number) => Promise<void>
  isUploading?: boolean
  uploadStatus?: UploadStatus
  coverageGaps?: CoverageGap[]
}

const CATEGORIES = ['ACADEMIC', 'ADMINISTRATIVE', 'FINANCIAL', 'STUDENT_AFFAIRS', 'GENERAL']

const PoliciesPage: React.FC<IPoliciesPageProps> = ({
  policies,
  isLoading = false,
  onFileUpload,
  onActivatePolicy,
  onDeactivatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
  isUploading = false,
  uploadStatus = { progress: 0, stage: 'idle', message: '' },
  coverageGaps = [],
}) => {
  const [editingPolicy, setEditingPolicy] = useState<IPolicy | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const handleEdit = (policy: IPolicy) => {
    setEditingPolicy(policy)
    setEditTitle(policy.title)
    setEditCategory(policy.category)
  }

  const handleSave = async () => {
    if (!editingPolicy || !onUpdatePolicy) return
    setIsSaving(true)
    try {
      await onUpdatePolicy(editingPolicy.id, { title: editTitle, category: editCategory })
      setEditingPolicy(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (policyId: number) => {
    if (!onDeletePolicy) return
    await onDeletePolicy(policyId)
    setDeleteConfirm(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label="Loading policies..." />
      </div>
    )
  }

  const getStageColor = (stage: UploadStatus['stage']) => {
    switch (stage) {
      case 'uploading':
        return 'bg-blue-500'
      case 'parsing':
        return 'bg-yellow-500'
      case 'processing':
        return 'bg-purple-500'
      case 'complete':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-teal-primary'
    }
  }

  const getStageIcon = (stage: UploadStatus['stage']) => {
    switch (stage) {
      case 'uploading':
        return 'upload'
      case 'parsing':
        return 'document-text'
      case 'processing':
        return 'refresh'
      case 'complete':
        return 'check-circle'
      case 'error':
        return 'exclamation-circle'
      default:
        return 'plus'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Progress Card */}
      {uploadStatus.stage !== 'idle' && (
        <Card variant="elevated" className="border-2 border-teal-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getStageColor(uploadStatus.stage)}`}
                >
                  {uploadStatus.stage === 'processing' || uploadStatus.stage === 'parsing' ? (
                    <Spinner size="sm" />
                  ) : (
                    <Icon
                      name={getStageIcon(uploadStatus.stage)}
                      size={20}
                      className="text-white"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-teal-deep">
                    {uploadStatus.fileName || 'Processing Document'}
                  </h3>
                  <p className="text-sm text-slate">{uploadStatus.message}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-teal-primary">{uploadStatus.progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getStageColor(uploadStatus.stage)}`}
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-between text-xs text-slate">
              <span
                className={uploadStatus.stage === 'uploading' ? 'text-blue-600 font-medium' : ''}
              >
                Upload
              </span>
              <span
                className={uploadStatus.stage === 'parsing' ? 'text-yellow-600 font-medium' : ''}
              >
                Parse PDF
              </span>
              <span
                className={uploadStatus.stage === 'processing' ? 'text-purple-600 font-medium' : ''}
              >
                Generate Embeddings
              </span>
              <span
                className={uploadStatus.stage === 'complete' ? 'text-green-600 font-medium' : ''}
              >
                Complete
              </span>
            </div>
          </div>
        </Card>
      )}

      {coverageGaps.length > 0 && (
        <Card variant="outlined">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-teal-deep">Coverage Gaps</h3>
              <p className="text-sm text-slate">
                Frequent escalated queries with no policy citations
              </p>
            </div>
            <Badge variant="warning" size="sm">
              {coverageGaps.length} intents
            </Badge>
          </div>
          <div className="space-y-3">
            {coverageGaps.map((gap) => (
              <div
                key={`${gap.intent}-${gap.sampleQuery}`}
                className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-teal-deep capitalize">{gap.intent}</p>
                  <Badge variant="warning" size="sm">
                    {gap.count}
                  </Badge>
                </div>
                <p className="text-sm text-slate mt-1">"{gap.sampleQuery}"</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card variant="outlined" padding="none">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-deep">Policy Library</h2>
            <p className="text-sm text-slate mt-1">{policies.length} policies in knowledge base</p>
          </div>
          <label
            className={`shrink-0 px-4 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium flex items-center space-x-2 ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-teal-primary text-white hover:bg-ocean-deep'
            }`}
          >
            <Icon
              name={isUploading ? 'cog' : 'plus'}
              size={16}
              className={isUploading ? 'animate-spin' : ''}
            />
            <span>{isUploading ? 'Processing...' : 'Upload New Policy'}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={onFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        <div className="divide-y divide-gray-100">
          {policies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-teal-mist rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="document-text" size={32} className="text-teal-primary" />
              </div>
              <div className="text-lg font-medium text-teal-deep">No policies yet</div>
              <div className="text-sm text-slate mt-1">
                Upload your first policy document to get started
              </div>
            </div>
          ) : (
            policies.map((policy) => (
              <div key={policy.id} className="p-4 sm:p-6 hover:bg-smoke transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-medium text-teal-deep">{policy.title}</h3>
                      <Badge variant={policy.active ? 'success' : 'warning'} size="sm">
                        {policy.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate">
                      <span className="flex items-center space-x-1">
                        <Icon name="folder" size={14} />
                        <span>{policy.category}</span>
                      </span>
                      <span>{policy.chunkCount || 0} chunks</span>
                      <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(policy)}>
                      <Icon name="pencil" size={14} className="mr-1" />
                      Edit
                    </Button>
                    {deleteConfirm === policy.id ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteConfirm(policy.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Icon name="trash" size={14} className="mr-1" />
                        Delete
                      </Button>
                    )}
                    {policy.active ? (
                      onDeactivatePolicy && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onDeactivatePolicy(policy.id)}
                          className="text-yellow-600 hover:bg-yellow-50"
                        >
                          Deactivate
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onActivatePolicy(policy.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card variant="elevated" className="w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-teal-deep">Edit Policy</h3>
                <button
                  onClick={() => setEditingPolicy(null)}
                  className="text-slate hover:text-teal-deep"
                >
                  <Icon name="x-circle" size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-teal-deep mb-2">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-primary focus:ring-2 focus:ring-teal-primary/20 outline-none transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setEditingPolicy(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || !editTitle.trim()}
                >
                  {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default PoliciesPage

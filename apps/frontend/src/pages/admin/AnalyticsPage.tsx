/**
 * Analytics Page
 * Display analytics and export data
 */

import React from 'react';
import type { IAnalyticsData } from '../../types';
import { Card, Button, Icon, Spinner } from '../../components/atoms';

interface IAnalyticsPageProps {
  analytics: IAnalyticsData | null;
  isLoading?: boolean;
  onExport: () => Promise<void>;
  isExporting?: boolean;
  errorMessage?: string | null;
}

const AnalyticsPage: React.FC<IAnalyticsPageProps> = ({
  analytics,
  isLoading = false,
  onExport,
  isExporting = false,
  errorMessage = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label="Loading analytics..." />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card variant="outlined" padding="md">
        <div className="text-center py-8 text-sm text-red-600">{errorMessage}</div>
      </Card>
    );
  }

  const renderConfidenceDistribution = () => {
    if (!analytics?.confidenceDistribution) {
      return <div className="text-center py-4 text-slate text-sm">No analytics data available</div>;
    }

    const dist = analytics.confidenceDistribution;
    const total = dist.HIGH + dist.MEDIUM + dist.LOW;
    const highPct = total > 0 ? Math.round((dist.HIGH / total) * 100) : 0;
    const medPct = total > 0 ? Math.round((dist.MEDIUM / total) * 100) : 0;
    const lowPct = total > 0 ? Math.round((dist.LOW / total) * 100) : 0;

    return (
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-24 text-sm text-slate">HIGH</div>
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${highPct}%` }} />
          </div>
          <div className="w-16 text-right text-sm font-medium text-teal-deep">{highPct}%</div>
        </div>
        <div className="flex items-center">
          <div className="w-24 text-sm text-slate">MEDIUM</div>
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${medPct}%` }} />
          </div>
          <div className="w-16 text-right text-sm font-medium text-teal-deep">{medPct}%</div>
        </div>
        <div className="flex items-center">
          <div className="w-24 text-sm text-slate">LOW</div>
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className="bg-red-500 h-3 rounded-full" style={{ width: `${lowPct}%` }} />
          </div>
          <div className="w-16 text-right text-sm font-medium text-teal-deep">{lowPct}%</div>
        </div>
      </div>
    );
  };

  const renderQueryCategories = () => {
    if (!analytics?.queryCategories || Object.keys(analytics.queryCategories).length === 0) {
      return <div className="text-center py-4 text-slate text-sm">No category data available</div>;
    }

    const categories = Object.entries(analytics.queryCategories);
    const total = categories.reduce((sum, [, count]) => sum + count, 0);
    const categoryColors = [
      { bg: 'bg-teal-mist', text: 'text-teal-deep', subtext: 'text-teal-primary' },
      { bg: 'bg-green-50', text: 'text-green-700', subtext: 'text-green-600' },
      { bg: 'bg-purple-50', text: 'text-purple-700', subtext: 'text-purple-600' },
      { bg: 'bg-orange-50', text: 'text-orange-700', subtext: 'text-orange-600' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(0, 4).map(([category, count], index) => {
          const colors = categoryColors[index % categoryColors.length];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={category} className={`${colors.bg} p-4 rounded-xl`}>
              <div className={`text-2xl font-bold ${colors.text}`}>{pct}%</div>
              <div className={`text-sm ${colors.subtext}`}>{category}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card variant="outlined" padding="md">
        <h2 className="text-lg font-semibold text-teal-deep mb-6">Query Analytics</h2>
        <div className="space-y-8">
          {/* Confidence Distribution */}
          <div>
            <h3 className="text-sm font-medium text-teal-deep mb-4">Confidence Distribution</h3>
            {renderConfidenceDistribution()}
          </div>

          {/* Top Query Categories */}
          <div>
            <h3 className="text-sm font-medium text-teal-deep mb-4">Top Query Categories</h3>
            {renderQueryCategories()}
          </div>

          {/* Export Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={onExport}
            isLoading={isExporting}
            leftIcon={<Icon name="document-download" size={20} />}
          >
            {isExporting ? 'Exporting...' : 'Export Full Report (CSV)'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;

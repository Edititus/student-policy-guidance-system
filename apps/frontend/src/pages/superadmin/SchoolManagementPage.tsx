/**
 * SchoolManagementPage — Super admin school overview
 * Lists all schools with stats per school
 */

import React from 'react';
import { Icon } from '../../components/atoms';
import { useAdminSchools } from '../../hooks/useSuperAdmin';

const SchoolManagementPage: React.FC = () => {
  const { data: schoolsData, isLoading } = useAdminSchools();
  const schools = schoolsData?.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-teal-deep">Schools</h1>
        <p className="text-slate mt-1">All registered institutions on the platform</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="spinner" size={24} className="text-teal-primary" />
          <span className="ml-3 text-slate">Loading schools...</span>
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Icon name="folder" size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-slate">No schools registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schools.map((school) => (
            <div
              key={school.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-teal-deep text-lg">{school.name}</h3>
                  <p className="text-sm text-slate">{school.domain}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-mist flex items-center justify-center">
                  <Icon name="folder" size={20} className="text-teal-primary" />
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate">
                {school.country && (
                  <span className="flex items-center space-x-1">
                    <span>{school.country}</span>
                  </span>
                )}
                {school.type && (
                  <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {school.type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolManagementPage;

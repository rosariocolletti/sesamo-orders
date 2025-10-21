import React from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { Mail, Phone } from 'lucide-react';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  clientView: (clientData: any) => React.ReactNode;
}

export function RoleBasedAccess({ children, clientView }: RoleBasedAccessProps) {
  const { role, clientData } = useUserRole();

  if (role === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (role === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Restricted Area
            </h2>
            <p className="text-gray-600 mb-6">
              Please contact us for access
            </p>
            <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <a href="mailto:sesamobrno@gmail.com" className="hover:text-blue-600 transition-colors">
                  sesamobrno@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <a href="tel:+420776421053" className="hover:text-blue-600 transition-colors">
                  +420 776 421 053
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'client' && clientData) {
    return <>{clientView(clientData)}</>;
  }

  return <>{children}</>;
}

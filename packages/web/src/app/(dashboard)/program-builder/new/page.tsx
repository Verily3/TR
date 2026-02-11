'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ProgramWizardForm } from '@/components/programs/ProgramWizardForm';
import type { Program } from '@/types/programs';

export default function NewProgramPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAgencyUser = !!user?.agencyId;
  const tenantId = user?.tenantId;

  const handleSuccess = (program: Program) => {
    const tenantParam = program.tenantId ? `?tenantId=${program.tenantId}` : '';
    router.push(`/program-builder/${program.id}${tenantParam}`);
  };

  const handleCancel = () => {
    router.push('/program-builder');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Programs
      </button>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Program</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set up your program in a few steps
        </p>
      </div>

      {/* Wizard form */}
      <ProgramWizardForm
        isAgencyUser={isAgencyUser}
        tenantId={tenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

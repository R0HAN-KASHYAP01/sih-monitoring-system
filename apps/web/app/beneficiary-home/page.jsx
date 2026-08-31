'use client';

import RoleGuard from '../../lib/RoleGuard';

export default function BeneficiaryHome() {
  return (
    <RoleGuard allowedRoles={['beneficiary']}>
      <h1 className="p-8 text-xl">Beneficiary Home</h1>
    </RoleGuard>
  );
}
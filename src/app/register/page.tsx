import { OrganizationRegisterForm } from '@/components/OrganizationRegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Organization - Mass Texter',
  description: 'Register your organization with Mass Texter',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Register Your Organization</h1>
        <OrganizationRegisterForm />
      </div>
    </div>
  );
} 
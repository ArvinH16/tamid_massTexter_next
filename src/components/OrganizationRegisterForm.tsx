'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, {
    message: "Please enter a valid phone number.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function OrganizationRegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/register-org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register organization');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Register Your Organization</CardTitle>
        <CardDescription>
          Fill out this form to register your organization with us.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitSuccess ? (
          <Alert className="bg-green-50 border-green-500 text-green-700">
            <AlertDescription>
              Registration successful! We'll review your information and get back to you soon.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                {...form.register('organizationName')}
                placeholder="Enter your organization name"
              />
              {form.formState.errors.organizationName && (
                <p className="text-sm text-red-500">{form.formState.errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter your email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                {...form.register('phoneNumber')}
                placeholder="Enter your phone number"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-500">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            {submitError && (
              <Alert className="bg-red-50 border-red-500 text-red-700">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </form>
        )}
      </CardContent>
      {!submitSuccess && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Register Organization'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 
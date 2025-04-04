'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Схема валідації для форми логіну
const loginSchema = z.object({
  email: z.string().email({ message: 'Необхідно ввести дійсну електронну пошту' }),
  password: z.string().min(6, { message: 'Пароль повинен містити не менше 6 символів' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { login, isLoading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setGeneralError(null);
    
    try {
      await login(data.email, data.password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setGeneralError('Помилка входу. Перевірте ваші облікові дані');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      {(generalError || error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {generalError || error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Електронна пошта</Label>
        <Input
          id="email"
          placeholder="example@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        data-testid="login-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Вхід...
          </>
        ) : (
          'Увійти'
        )}
      </Button>
    </form>
  );
}
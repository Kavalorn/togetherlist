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

// Схема валідації для форми реєстрації
const signupSchema = z.object({
  email: z.string().email({ message: 'Необхідно ввести дійсну електронну пошту' }),
  password: z.string().min(6, { message: 'Пароль повинен містити не менше 6 символів' }),
  confirmPassword: z.string().min(6, { message: 'Пароль повинен містити не менше 6 символів' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signup, isLoading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  const onSubmit = async (data: SignupFormValues) => {
    setGeneralError(null);
    setSuccessMessage(null);
    
    try {
      await signup(data.email, data.password);
      
      // Якщо відповідь не містить сесію, це означає, що потрібно підтвердити пошту
      if (!useAuthStore.getState().session) {
        setSuccessMessage('Будь ласка, перевірте вашу електронну пошту для підтвердження облікового запису');
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setGeneralError('Помилка реєстрації. Можливо, така електронна пошта вже використовується');
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
      
      {successMessage && (
        <Alert>
          <AlertDescription>
            {successMessage}
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
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Підтвердження паролю</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Реєстрація...
          </>
        ) : (
          'Зареєструватися'
        )}
      </Button>
    </form>
  );
}
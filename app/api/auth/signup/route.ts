import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Тип для запиту аутентифікації
interface AuthRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { email, password }: AuthRequest = await request.json();
    
    // Отримуємо URL для перенаправлення після підтвердження електронної пошти
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`
      }
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      user: data.user, 
      session: data.session 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
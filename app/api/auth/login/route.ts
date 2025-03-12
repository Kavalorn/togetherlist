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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
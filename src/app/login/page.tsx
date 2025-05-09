
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleDollarSign, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from 'react';
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // Clear user-specific data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('payright-subscriptions');
      localStorage.removeItem('payright-wallets');
      localStorage.removeItem('payright-transactions');
    }
    // In a real app, you would handle authentication here
    // For now, we just navigate to the dashboard
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <header className="absolute top-0 left-0 right-0 container mx-auto py-6 px-4 md:px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">PayRight</h1>
        </Link>
      </header>
      
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Image 
              src="https://picsum.photos/seed/payright_login_v2/80/80" 
              alt="Login Icon" 
              width={80} 
              height={80} 
              className="rounded-full shadow-lg"
              data-ai-hint="secure login"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Login to PayRight</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
       <footer className="absolute bottom-0 text-center py-6 text-muted-foreground text-sm">
        © {new Date().getFullYear()} PayRight. All rights reserved.
      </footer>
    </div>
  );
}

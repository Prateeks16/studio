
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleDollarSign, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from 'react';
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real app, you would handle user registration here
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
              src="https://picsum.photos/seed/payright_signup/80/80" 
              alt="Sign Up Icon" 
              width={80} 
              height={80} 
              className="rounded-full shadow-lg"
              data-ai-hint="user registration icon"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Create your PayRight Account</CardTitle>
          <CardDescription>Join us to manage your subscriptions effectively.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
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

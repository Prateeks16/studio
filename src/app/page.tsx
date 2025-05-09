
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, TrendingUp, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto py-6 px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">PayRight</h1>
        </div>
        <nav>
          <Link href="/login">
            <Button variant="outline">Login / Sign Up</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
              <div className="mx-auto mb-6">
                <Image 
                  src="https://picsum.photos/seed/payright_logo_v2/120/120" 
                  alt="PayRight App Icon" 
                  width={120} 
                  height={120} 
                  className="rounded-full shadow-lg"
                  data-ai-hint="brand logo" 
                />
              </div>
              <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Take Control of Your Subscriptions
              </CardTitle>
              <CardDescription className="mt-4 text-lg text-muted-foreground">
                PayRight helps you detect recurring charges, find cheaper alternatives, and manage your subscription spending effectively.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <ScanLineIcon className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Detect Charges</h3>
                <p className="text-sm text-muted-foreground">Automatically find all your subscriptions.</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Save Money</h3>
                <p className="text-sm text-muted-foreground">Get suggestions for cheaper alternatives.</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <EyeOff className="h-10 w-10 text-primary mb-2" />
                <h3 className="font-semibold">Track Spending</h3> {/* Changed from "Avoid Surprises" */}
                <p className="text-sm text-muted-foreground">Understand where your money goes.</p>
              </div>
            </CardContent>
            <CardFooter className="mt-8 flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Get Started Now
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="text-center py-6 text-muted-foreground text-sm">
        © {new Date().getFullYear()} PayRight. All rights reserved.
      </footer>
    </div>
  );
}

// Placeholder for ScanLineIcon if not available or to customize
function ScanLineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  )
}


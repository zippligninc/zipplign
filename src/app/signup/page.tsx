
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/">
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">Sign up</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>
      
      <ScrollArea className="flex-1">
        <main className="px-6 pt-8">
          <h2 className="text-xl font-bold">What's your birthday?</h2>
          <p className="text-muted-foreground mt-1 text-sm">Your birthday won't be shown publicly</p>
          <div className="flex w-full gap-2 mt-8">
            <Select defaultValue="month">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[...Array(12)].map((_, i) => (
                      <SelectItem key={i} value={String(i+1)}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select defaultValue="day">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                  <SelectGroup>
                      {[...Array(31)].map((_, i) => (
                          <SelectItem key={i} value={String(i+1)}>{i+1}</SelectItem>
                      ))}
                  </SelectGroup>
              </SelectContent>
            </Select>
            <Select defaultValue="year">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                  <SelectGroup>
                      {[...Array(100)].map((_, i) => (
                          <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                              {new Date().getFullYear() - i}
                          </SelectItem>
                      ))}
                  </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <p className="mt-4 text-xs text-muted-foreground max-w-sm">
            By signing up, you confirm that you agree to our term of Use and have read and understood our privacy policy. If you signup with SMS, SMS free may apply
          </p>

          <Button className="w-full mt-6" asChild>
            <Link href="/signup/email">Next</Link>
          </Button>
        </main>
      </ScrollArea>
    </div>
  );
}

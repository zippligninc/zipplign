
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoLarge } from '@/components/common/logo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const avatars = [
    { image: '/Images/F1.jpg', top: '15%', left: '10%', size: '30px' },
    { image: '/Images/F2.jpg', top: '25%', left: '80%', size: '40px' },
    { image: '/Images/F3.jpg', top: '40%', left: '5%', size: '25px' },
    { image: '/Images/F4.jpg', top: '55%', left: '90%', size: '35px' },
    { image: '/Images/F5.jpg', top: '70%', left: '15%', size: '30px' },
    { image: '/Images/F6.jpg', top: '80%', left: '75%', size: '45px' },
];

export default function WelcomePage() {
    const router = useRouter();

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1a1a] to-[#1a0a0a] text-white">
            
            {/* Background avatars */}
            {avatars.map((avatar, index) => (
                <Image
                    key={index}
                    src={avatar.image}
                    alt="User avatar"
                    width={100}
                    height={100}
                    className="absolute rounded-full object-cover blur-sm opacity-50 aspect-square"
                    style={{ top: avatar.top, left: avatar.left, width: avatar.size, height: avatar.size }}
                />
            ))}

            {/* Central avatar */}
            <Image
                src="/Images/F1.jpg"
                alt="Main user avatar"
                width={72}
                height={72}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover border-4 border-background shadow-lg aspect-square"
                data-ai-hint="woman smiling thumbs up"
            />
            
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between p-8">
                <div className="flex flex-col items-center text-center pt-20">
                    <LogoLarge className="h-12 w-12 rounded-lg" />
                    <h1 className="mt-2 text-2xl font-bold tracking-tight">Zipplign</h1>
                </div>

                <div className="w-full max-w-sm">
                    <div className="space-y-3">
                        <Button 
                            className="w-full h-10 bg-gradient-to-r from-green-400 to-teal-500 text-sm font-bold text-black"
                            onClick={() => router.push('/login')}
                        >
                            Login
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full h-10 border-white/50 bg-white/10 text-sm font-bold backdrop-blur-sm"
                            onClick={() => router.push('/signup')}
                        >
                            Sign up
                        </Button>
                    </div>
                    <Button 
                        variant="link" 
                        className="mt-4 w-full text-white/70 text-sm"
                        onClick={() => router.push('/home')}
                    >
                        Skip
                    </Button>
                </div>
            </div>
        </div>
    );
}

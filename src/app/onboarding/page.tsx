
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const onboardingSteps = [
  {
    image: {
      src: 'https://picsum.photos/seed/onboarding-bg/720/1280',
      hint: 'woman singing',
    },
    title: 'Welcome to Zippline',
    description: 'Discover, create, and share short videos that matter to you.',
  },
  {
    image: {
      src: 'https://picsum.photos/seed/onboarding-2/720/1280',
      hint: 'woman makeup tutorial',
    },
    title: 'Personalized For You',
    description: 'Your feed is curated based on what you watch, like, and share.',
  },
  {
    image: {
      src: 'https://picsum.photos/seed/onboarding-3/720/1280',
      hint: 'man in plaid shirt',
    },
    title: 'Create & Inspire',
    description: 'Use powerful tools to bring your creative ideas to life.',
  },
  {
    image: {
      src: 'https://picsum.photos/seed/onboarding-4/720/1280',
      hint: 'app interface',
    },
    title: 'Start Your Journey',
    description: 'Let\'s get started by personalizing your experience.',
  },
];


export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < onboardingSteps.length - 1) {
      setCurrent(current + 1);
    } else {
      router.push('/onboarding/interests');
    }
  };

  const currentStep = onboardingSteps[current];
  const isLastStep = current === onboardingSteps.length - 1;

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white">
      <Image
        src={currentStep.image.src}
        alt="Onboarding background"
        fill
        className="object-cover transition-opacity duration-500"
        data-ai-hint={currentStep.image.hint}
        key={current}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/50 to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end p-8 text-center">
        <div className="flex justify-center space-x-2 mb-6">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full bg-white/50 transition-all',
                current === index ? 'w-6 bg-white' : ''
              )}
            />
          ))}
        </div>
        <h1 className="text-3xl font-bold">{currentStep.title}</h1>
        <p className="mt-2 text-white/80 max-w-sm">
          {currentStep.description}
        </p>
        <Button
          className="mt-8 w-full max-w-sm h-12 bg-gradient-to-r from-green-400 to-teal-500 text-black font-bold"
          onClick={handleNext}
        >
          {isLastStep ? 'Get Started' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

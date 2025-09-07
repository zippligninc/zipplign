
'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Music,
  SwitchCamera,
  Zap,
  Percent,
  Wand2,
  Camera as CameraIcon,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { DraftService, CreateDraftData } from '@/lib/drafts';

const RightSidebarButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn(
        "h-auto flex-col gap-1 text-white",
        isActive && "text-primary"
    )}
    onClick={onClick}
  >
    <Icon className="h-5 w-5" />
    <span className="text-xs font-light">{label}</span>
  </Button>
);

type Duration = '10m' | '60s' | '15s';
type Mode = 'Photos' | 'Camera';


export default function CreatePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashOn, setIsFlashOn] = useState(false);
  
  const [isEffectOn, setIsEffectOn] = useState(false);
  const [isRatioActive, setIsRatioActive] = useState(false);
  const [isBeautifyOn, setIsBeautifyOn] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState<Duration>('15s');
  const [selectedMode, setSelectedMode] = useState<Mode>('Camera');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  // Zipplign Core Feature: 5-Second Countdown Timer
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  // Zipplign Core Feature: 3-Minute Video Duration Limit
  const MAX_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
  const [durationTimer, setDurationTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Draft functionality
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  
  // Zipplign Core Feature: Music Integration
  const [selectedMusic, setSelectedMusic] = useState<any>(null);


  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      if (selectedMode !== 'Camera' && selectedMode !== 'Photos') {
        setHasCameraPermission(null);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
          },
          audio: selectedMode === 'Camera', // Request audio only for video recording
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (selectedMode === 'Camera') {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks((prev) => [...prev, event.data]);
            }
          };
          mediaRecorderRef.current.onstop = () => {
             // Handled in handleStopRecording
          };
        }

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Cleanup duration timer
      if (durationTimer) {
        clearTimeout(durationTimer);
      }
    };
  }, [selectedMode, facingMode, toast]);

  // Check for selected music on component mount
  useEffect(() => {
    const music = sessionStorage.getItem('selectedMusic');
    if (music) {
      try {
        setSelectedMusic(JSON.parse(music));
        // Clear it after reading to avoid persistence
        sessionStorage.removeItem('selectedMusic');
      } catch (error) {
        console.error('Error parsing selected music:', error);
      }
    }
  }, []);

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleToggleFlash = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    // @ts-ignore
    if (!capabilities.torch) {
        toast({
            variant: "destructive",
            title: "Flash Not Supported",
            description: "Your device or camera does not support flash control.",
        });
        return;
    }

    try {
        await videoTrack.applyConstraints({
            // @ts-ignore
            advanced: [{ torch: !isFlashOn }],
        });
        setIsFlashOn(!isFlashOn);
    } catch (error) {
        console.error("Error toggling flash:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not toggle flash.",
        });
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        
        try {
          sessionStorage.setItem('capturedImage', dataUrl);
          sessionStorage.removeItem('capturedVideo');
          // Force music selection step for images
          router.push('/create/music');
        } catch (error) {
          console.error("Error storing image:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save photo. Storage might be full.",
          });
        }
      }
    }
  };
  
  // Zipplign Core Feature: Start countdown before recording
  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(5);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          handleStartRecording(); // Start actual recording
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartRecording = () => {
    if (mediaRecorderRef.current) {
      setRecordedChunks([]);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Zipplign Core Feature: Auto-stop after 3 minutes
      const timer = setTimeout(() => {
        if (isRecording) {
          handleStopRecording();
          toast({
            title: "Recording Complete",
            description: "Maximum 3-minute duration reached",
            duration: 3000,
          });
        }
      }, MAX_DURATION);
      
      setDurationTimer(timer);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear the duration timer when stopping
      if (durationTimer) {
        clearTimeout(durationTimer);
        setDurationTimer(null);
      }
    }
  };

  // Draft saving functionality
  const saveAsDraft = async (mediaData?: { url: string; type: 'image' | 'video' }) => {
    try {
      setIsDraftSaving(true);
      
      const draftData: CreateDraftData = {
        media_url: mediaData?.url,
        media_type: mediaData?.type,
        song: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : undefined,
        song_avatar_url: selectedMusic?.image,
        spotify_preview_url: selectedMusic?.preview_url || null,
        is_public: false
      };

      let draft;
      if (currentDraftId) {
        draft = await DraftService.updateDraft(currentDraftId, draftData);
      } else {
        draft = await DraftService.createDraft(draftData);
        setCurrentDraftId(draft?.id || null);
      }

      if (draft) {
        toast({
          title: "Draft Saved",
          description: "Your content has been saved as a draft.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error Saving Draft",
        description: "Could not save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const autoSaveDraft = useCallback(async () => {
    // Auto-save every 30 seconds if there's content
    if (recordedChunks.length > 0 || selectedMusic) {
      await saveAsDraft();
    }
  }, [recordedChunks, selectedMusic, currentDraftId]);

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        try {
            sessionStorage.setItem('capturedVideo', base64data);
            sessionStorage.removeItem('capturedImage');
            router.push('/create/post');
        } catch (error) {
            console.error("Error storing video:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save video. Storage might be full.",
            });
        }
      };
      setRecordedChunks([]);
    }
  }, [isRecording, recordedChunks, router, toast]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      autoSaveDraft();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveDraft]);

  const handleMainButtonPress = () => {
    if (selectedMode === 'Camera') {
      if (isRecording) {
        handleStopRecording();
      } else if (isCountingDown) {
        // Cancel countdown if user presses during countdown
        setIsCountingDown(false);
        setCountdown(0);
      } else {
        startCountdown(); // Start countdown instead of immediate recording
      }
    } else if (selectedMode === 'Photos') {
      handleTakePhoto();
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      console.log('Data URL created, length:', dataUrl.length);
      
      if (file.type.startsWith('image/')) {
        console.log('Storing as image');
        sessionStorage.setItem('capturedImage', dataUrl);
        sessionStorage.removeItem('capturedVideo');
        // Force music selection flow for images
        router.push('/create/music');
      } else if (file.type.startsWith('video/')) {
        console.log('Storing as video');
        sessionStorage.setItem('capturedVideo', dataUrl);
        sessionStorage.removeItem('capturedImage');
        router.push('/create/post');
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported File Type",
          description: "Please select an image or video file.",
        });
        return;
      }
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between bg-black text-white">
      {/* Camera View */}
      <div className="absolute inset-0 z-0">
         {(selectedMode === 'Camera' || selectedMode === 'Photos') ? (
            <>
            <video 
                ref={videoRef} 
                className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    isBeautifyOn && "brightness-105 contrast-105 saturate-125"
                )} 
                autoPlay 
                muted 
                playsInline 
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            </>
         ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
                 <p className="text-2xl font-bold text-white/50">{selectedMode} Mode</p>
            </div>
         )}
         {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access in your browser settings to use this feature.
                    </AlertDescription>
                </Alert>
            </div>
         )}
         {hasCameraPermission === null && (selectedMode === 'Camera' || selectedMode === 'Photos') && (
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p>Requesting camera permission...</p>
             </div>
         )}
         
         {/* Zipplign Core Feature: 5-Second Countdown Overlay */}
         {isCountingDown && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
             <div className="text-center">
               <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                 {countdown}
               </div>
               <p className="text-xl text-white/80">Get ready to Zipp!</p>
             </div>
           </div>
         )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />


      {/* Header */}
      <header className="absolute top-0 z-10 flex w-full items-center justify-between p-4">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full bg-black/30 px-3 py-1 h-auto text-xs"
            asChild
          >
            <Link href="/create/music">
              <Music className="mr-1.5 h-3 w-3" />
              <span>{selectedMusic ? selectedMusic.title : 'Add sound'}</span>
            </Link>
          </Button>
          {(recordedChunks.length > 0 || selectedMusic) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full bg-blue-600/80 px-3 py-1 h-auto text-xs text-white"
              onClick={() => saveAsDraft()}
              disabled={isDraftSaving}
            >
              {isDraftSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
        </div>
        <div className="w-7" />
      </header>

      {/* Right Sidebar */}
      <aside className="absolute right-3 top-1/4 z-10 flex flex-col items-center gap-4">
        <RightSidebarButton icon={SwitchCamera} label="Flip" onClick={handleFlipCamera} />
        <RightSidebarButton icon={Zap} label="Flash" isActive={isFlashOn} onClick={handleToggleFlash} />
        <RightSidebarButton icon={Percent} label="Ratio" isActive={isRatioActive} onClick={() => setIsRatioActive(!isRatioActive)} />
        <RightSidebarButton icon={Wand2} label="Beautify" isActive={isBeautifyOn} onClick={() => setIsBeautifyOn(!isBeautifyOn)} />
      </aside>

      {/* Bottom Controls */}
      <main className="absolute bottom-0 z-10 flex w-full flex-col items-center pb-4">
        <div className="flex items-center gap-4 text-xs font-medium text-white/80">
          {(['10m', '60s', '15s'] as Duration[]).map(d => (
            <button key={d} onClick={() => setSelectedDuration(d)} className={cn(selectedDuration === d && 'text-white font-bold', selectedMode !== 'Camera' && 'hidden')}>
              {d}
            </button>
          ))}
          <button onClick={() => setSelectedMode('Photos')} className={cn("rounded-full px-3 py-1 text-xs", selectedMode === 'Photos' ? 'bg-white text-black' : 'bg-black/40')}>Photos</button>
        </div>

        <div className="mt-4 flex w-full items-center justify-around px-8">
          <Button variant="ghost" className={cn("flex-col gap-1 h-auto p-1 text-xs", isEffectOn && "text-primary")} onClick={() => setIsEffectOn(!isEffectOn)}>
             <div className="h-6 w-6 rounded-md bg-white/20"></div>
            <span>Effect</span>
          </Button>

          <button
            onClick={handleMainButtonPress}
            className={cn(
                "h-14 w-14 rounded-full border-4 border-white transition-all duration-300 flex items-center justify-center",
                isRecording ? "bg-transparent ring-4 ring-primary" : "bg-primary/70 ring-4 ring-primary/30 ring-offset-2 ring-offset-black",
                selectedMode === 'Photos' && "bg-white ring-white/30"
            )}
          >
            {isRecording && <div className="h-5 w-5 rounded bg-primary" />}
            {selectedMode === 'Photos' && <CameraIcon className="h-6 w-6 text-black" />}
            <span className="sr-only">{selectedMode === 'Camera' ? (isRecording ? 'Stop Recording' : 'Start Recording') : 'Take Photo'}</span>
          </button>
          
          <Button variant="ghost" className="flex-col gap-1 h-auto p-1 text-xs" onClick={handleUploadClick}>
             <Upload className="h-5 w-5" />
            <span>Upload</span>
          </Button>
        </div>
        
        <div className="w-full mt-3 flex justify-center items-center gap-8 text-sm text-white/80">
            <button
                className={cn("relative py-1 font-semibold after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-5 after:rounded-full after:bg-transparent", selectedMode === 'Camera' && "text-white after:bg-white")}
                onClick={() => setSelectedMode('Camera')}
            >
                Camera
            </button>
            <button
                className={cn("relative py-1 font-semibold after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-5 after:rounded-full after:bg-transparent", selectedMode !== 'Camera' && selectedMode !== 'Photos' && "text-white after:bg-white")}
            >
                Templates
            </button>
        </div>
        
      </main>
    </div>
  );
}

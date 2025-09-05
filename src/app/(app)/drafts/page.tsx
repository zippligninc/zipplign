'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Play, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DraftService, Draft } from '@/lib/drafts';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function DraftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const userDrafts = await DraftService.getUserDrafts();
      setDrafts(userDrafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error Loading Drafts",
        description: "Could not load your drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      setDeletingId(draftId);
      await DraftService.deleteDraft(draftId);
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      toast({
        title: "Draft Deleted",
        description: "Your draft has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error Deleting Draft",
        description: "Could not delete draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    // Store draft data in session storage for editing
    if (draft.media_url) {
      sessionStorage.setItem('capturedVideo', draft.media_url);
      sessionStorage.setItem('capturedImage', draft.media_url);
    }
    if (draft.song) {
      sessionStorage.setItem('selectedMusic', JSON.stringify({
        title: draft.song.split(' - ')[0],
        artist: draft.song.split(' - ')[1] || '',
        image: draft.song_avatar_url || '',
        duration: '0:00'
      }));
    }
    router.push('/create/post');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Drafts</h1>
          <div className="w-10" />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading drafts...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Drafts</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Edit className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Drafts Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start creating content and your drafts will appear here.
            </p>
            <Button onClick={() => router.push('/create')}>
              Start Creating
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-card border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {draft.media_url ? (
                    <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden">
                      {draft.media_type === 'video' ? (
                        <video
                          src={draft.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <Image
                          src={draft.media_url}
                          alt="Draft preview"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Edit className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(draft.updated_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                          className="h-8 px-2"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id)}
                          disabled={deletingId === draft.id}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {draft.description && (
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        {draft.description}
                      </p>
                    )}
                    
                    {draft.song && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Play className="w-3 h-3" />
                        <span className="truncate">{draft.song}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

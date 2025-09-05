'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { mockUsers, freeVideoSources } from '@/lib/sample-content';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Video, CheckCircle } from 'lucide-react';

export default function SeedContentPage() {
  const [loading, setLoading] = useState(false);
  const [seededUsers, setSeededUsers] = useState(0);
  const [seededVideos, setSeededVideos] = useState(0);
  const { toast } = useToast();

  const seedUsers = async () => {
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database connection not available',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const user of mockUsers) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            zipping_count: user.zipping_count,
            zippers_count: user.zippers_count,
            likes_count: user.likes_count,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!error) {
          successCount++;
        } else {
          console.error('Error seeding user:', user.username, error);
        }
      }

      setSeededUsers(successCount);
      toast({
        title: 'Success',
        description: `Seeded ${successCount} users successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error seeding users:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const seedVideos = async () => {
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database connection not available',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const video of freeVideoSources) {
        const { error } = await supabase
          .from('zippclips')
          .upsert({
            id: video.id,
            user_id: video.user_id,
            media_url: video.media_url,
            media_type: video.media_type,
            description: video.description,
            song: video.song,
            song_avatar_url: video.song_avatar_url,
            likes: video.likes,
            comments: video.comments,
            saves: video.saves,
            shares: video.shares,
            created_at: video.created_at,
            updated_at: new Date().toISOString()
          });

        if (!error) {
          successCount++;
        } else {
          console.error('Error seeding video:', video.id, error);
        }
      }

      setSeededVideos(successCount);
      toast({
        title: 'Success',
        description: `Seeded ${successCount} videos successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error seeding videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed videos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const seedAll = async () => {
    await seedUsers();
    await seedVideos();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Seed Content</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                Mock Users
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add {mockUsers.length} sample users with profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={seedUsers} 
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Seed Users
              </Button>
              {seededUsers > 0 && (
                <div className="flex items-center gap-2 mt-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Seeded {seededUsers} users</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Video className="w-5 h-5" />
                Free Videos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add {freeVideoSources.length} sample videos from free sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={seedVideos} 
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Video className="w-4 h-4 mr-2" />
                )}
                Seed Videos
              </Button>
              {seededVideos > 0 && (
                <div className="flex items-center gap-2 mt-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Seeded {seededVideos} videos</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Seed Everything</CardTitle>
            <CardDescription className="text-gray-400">
              Add all sample users and videos at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={seedAll} 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Seed All Content
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Sample Content Includes:</h3>
          <ul className="text-gray-300 space-y-1">
            <li>• {mockUsers.length} diverse mock users with realistic profiles</li>
            <li>• {freeVideoSources.length} high-quality free videos from Google's test bucket</li>
            <li>• Various content types: tech, music, fitness, food, travel, art</li>
            <li>• Realistic engagement metrics (likes, comments, saves, shares)</li>
            <li>• Song information with album artwork</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

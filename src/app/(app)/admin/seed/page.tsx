'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Video, Image, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { seedSampleData, sampleZippclips } from '@/lib/sample-data';
import { useToast } from '@/hooks/use-toast';

export default function SeedDataPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const result = await seedSampleData(supabase);
      setSeedResult(result);

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Sample data has been seeded successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to seed data',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setSeedResult({ success: false, error: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all zippclips data? This action cannot be undone.')) {
      return;
    }

    setIsSeeding(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Delete all zippclips
      const { error } = await supabase
        .from('zippclips')
        .delete()
        .neq('id', ''); // This will delete all rows

      if (error) throw error;

      toast({
        title: 'Data Cleared',
        description: 'All zippclips have been removed.',
      });
      setSeedResult(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear data',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Seeder</h1>
        <p className="text-muted-foreground">
          Populate your Zipper app with sample video content for testing and development.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Sample Data Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sample Data Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Video className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-semibold">{sampleZippclips.length} Videos</p>
                  <p className="text-sm text-muted-foreground">High-quality sample content</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold">{sampleZippclips.length} Users</p>
                  <p className="text-sm text-muted-foreground">Diverse creator profiles</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Image className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-semibold">HD Quality</p>
                  <p className="text-sm text-muted-foreground">Professional content</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seed Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Seed Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                This will populate your database with sample zippclips and user profiles. 
                Videos are hosted on Google's servers and are free to use for testing.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="flex-1"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Sample Data
                  </>
                )}
              </Button>

              <Button
                onClick={handleClearData}
                disabled={isSeeding}
                variant="destructive"
              >
                Clear All Data
              </Button>
            </div>

            {seedResult && (
              <Alert className={seedResult.success ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription>
                  {seedResult.success ? 
                    '✅ Sample data seeded successfully! Check your home page to see the content.' :
                    `❌ Error: ${seedResult.error}`
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Video Sources Info */}
        <Card>
          <CardHeader>
            <CardTitle>Video Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Sample Videos Include:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Big Buck Bunny (Animated Short)</li>
                  <li>• Sintel (3D Animation)</li>
                  <li>• Tears of Steel (Sci-Fi Short)</li>
                  <li>• Nature & Adventure Content</li>
                  <li>• Automotive Content</li>
                  <li>• Various Creative Shorts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">For Production Use:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Replace with user-generated content</li>
                  <li>• Integrate with Pexels/Pixabay APIs</li>
                  <li>• License professional content</li>
                  <li>• Partner with content creators</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

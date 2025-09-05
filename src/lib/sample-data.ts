// Sample data for testing Zipper app
export const sampleZippclips = [
  {
    description: 'Beautiful nature escape #nature #peaceful #explore',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    media_type: 'video',
    song: 'Nature Sounds - Peaceful Vibes',
    song_avatar_url: 'https://picsum.photos/64/64?random=1',
    user_data: {
      username: 'naturelover',
      full_name: 'Nature Explorer',
      avatar_url: 'https://picsum.photos/128/128?random=101'
    }
  },
  {
    description: 'Fun adventures await! #adventure #fun #outdoors',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    media_type: 'video',
    song: 'Adventure Theme - Epic Journey',
    song_avatar_url: 'https://picsum.photos/64/64?random=2',
    user_data: {
      username: 'adventureseeker',
      full_name: 'Adventure Enthusiast',
      avatar_url: 'https://picsum.photos/128/128?random=102'
    }
  },
  {
    description: 'Joy rides and good vibes #joyride #cars #freedom',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    media_type: 'video',
    song: 'Road Trip Anthem',
    song_avatar_url: 'https://picsum.photos/64/64?random=3',
    user_data: {
      username: 'roadtripper',
      full_name: 'Road Trip Master',
      avatar_url: 'https://picsum.photos/128/128?random=103'
    }
  },
  {
    description: 'Epic blazes and fire content 🔥 #fire #epic #amazing',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    media_type: 'video',
    song: 'Fire Beat - Hot Vibes',
    song_avatar_url: 'https://picsum.photos/64/64?random=4',
    user_data: {
      username: 'firemaster',
      full_name: 'Fire Content Creator',
      avatar_url: 'https://picsum.photos/128/128?random=104'
    }
  },
  {
    description: 'Meltdown moments that hit different #emotional #real #life',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    media_type: 'video',
    song: 'Emotional Journey',
    song_avatar_url: 'https://picsum.photos/64/64?random=5',
    user_data: {
      username: 'realtalker',
      full_name: 'Authentic Creator',
      avatar_url: 'https://picsum.photos/128/128?random=105'
    }
  },
  {
    description: 'Cinematic masterpiece - Sintel #animation #art #cinema',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    media_type: 'video',
    song: 'Cinematic Score',
    song_avatar_url: 'https://picsum.photos/64/64?random=6',
    user_data: {
      username: 'animator',
      full_name: 'Animation Artist',
      avatar_url: 'https://picsum.photos/128/128?random=106'
    }
  },
  {
    description: 'Big Buck Bunny adventure! #animation #funny #classic',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    media_type: 'video',
    song: 'Funny Cartoon Theme',
    song_avatar_url: 'https://picsum.photos/64/64?random=7',
    user_data: {
      username: 'cartoonlover',
      full_name: 'Animation Fan',
      avatar_url: 'https://picsum.photos/128/128?random=107'
    }
  },
  {
    description: 'Elephants Dream - surreal journey #surreal #dreams #art',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    media_type: 'video',
    song: 'Dreamy Soundscape',
    song_avatar_url: 'https://picsum.photos/64/64?random=8',
    user_data: {
      username: 'dreamer',
      full_name: 'Surreal Artist',
      avatar_url: 'https://picsum.photos/128/128?random=108'
    }
  },
  {
    description: 'Tears of Steel - sci-fi masterpiece #scifi #future #tech',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    media_type: 'video',
    song: 'Futuristic Beats',
    song_avatar_url: 'https://picsum.photos/64/64?random=9',
    user_data: {
      username: 'scifiguru',
      full_name: 'Sci-Fi Creator',
      avatar_url: 'https://picsum.photos/128/128?random=109'
    }
  },
  {
    description: 'Subaru adventure on street and dirt #cars #offroad #adventure',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    media_type: 'video',
    song: 'Off-Road Adventure',
    song_avatar_url: 'https://picsum.photos/64/64?random=10',
    user_data: {
      username: 'carexpert',
      full_name: 'Automotive Enthusiast',
      avatar_url: 'https://picsum.photos/128/128?random=110'
    }
  }
];

// Function to insert sample data into Supabase
export async function seedSampleData(supabase: any) {
  try {
    console.log('🌱 Seeding sample data...');
    
    for (const sample of sampleZippclips) {
      // First, create or get the user profile
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', sample.user_data.username)
        .single();

      let userId = existingUser?.id;

      if (!existingUser) {
        // Create a new user profile (this would normally be done via auth)
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            username: sample.user_data.username,
            full_name: sample.user_data.full_name,
            avatar_url: sample.user_data.avatar_url
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          continue;
        }
        userId = newProfile.id;
      }

      // Create the zippclip
      const { error: clipError } = await supabase
        .from('zippclips')
        .insert({
          user_id: userId,
          description: sample.description,
          media_url: sample.media_url,
          media_type: sample.media_type,
          song: sample.song,
          song_avatar_url: sample.song_avatar_url,
          likes: Math.floor(Math.random() * 1000) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          saves: Math.floor(Math.random() * 200) + 10,
          shares: Math.floor(Math.random() * 50) + 2
        });

      if (clipError) {
        console.error('Error creating zippclip:', clipError);
      } else {
        console.log(`✅ Created zippclip: ${sample.description.substring(0, 30)}...`);
      }
    }

    console.log('🎉 Sample data seeding complete!');
    return { success: true, message: 'Sample data seeded successfully' };
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    return { success: false, error: error.message };
  }
}

// Alternative: Static image placeholders for testing
export const sampleImages = [
  'https://picsum.photos/720/1280?random=1',
  'https://picsum.photos/720/1280?random=2', 
  'https://picsum.photos/720/1280?random=3',
  'https://picsum.photos/720/1280?random=4',
  'https://picsum.photos/720/1280?random=5'
];

// Fetch videos from external API (Pexels example)
export async function fetchPexelsVideos(apiKey: string, query: string = 'vertical') {
  try {
    const response = await fetch(`https://api.pexels.com/videos/search?query=${query}&orientation=portrait&per_page=20`, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch videos from Pexels');
    }

    const data = await response.json();
    
    return data.videos.map((video: any, index: number) => ({
      description: `Amazing ${query} content #${query} #trending`,
      media_url: video.video_files.find((file: any) => file.quality === 'hd')?.link || video.video_files[0]?.link,
      media_type: 'video',
      song: `Trending Sound ${index + 1}`,
      song_avatar_url: `https://picsum.photos/64/64?random=${index + 20}`,
      user_data: {
        username: `creator${index + 1}`,
        full_name: `Content Creator ${index + 1}`,
        avatar_url: `https://picsum.photos/128/128?random=${index + 200}`
      }
    }));
  } catch (error) {
    console.error('Error fetching Pexels videos:', error);
    return [];
  }
}

# Video Sources for Zipper App Testing

## 🎥 **FREE VIDEO SOURCES FOR DEVELOPMENT**

### **1. Sample Video APIs (Recommended)**

#### **Pixabay Videos API**
- **URL**: `https://pixabay.com/api/videos/`
- **Free**: 20,000 requests/month
- **Quality**: HD videos
- **Usage**: 
  ```javascript
  const API_KEY = 'your-pixabay-key';
  const response = await fetch(`https://pixabay.com/api/videos/?key=${API_KEY}&category=people&min_width=720`);
  ```

#### **Pexels Videos API**
- **URL**: `https://www.pexels.com/api/documentation/#videos`
- **Free**: 200 requests/hour
- **Quality**: HD/4K videos
- **Usage**:
  ```javascript
  const response = await fetch('https://api.pexels.com/videos/search?query=people&per_page=20', {
    headers: { 'Authorization': 'YOUR_PEXELS_API_KEY' }
  });
  ```

### **2. Static Sample Videos (Quick Setup)**

#### **Sample Video URLs** (for immediate testing):
```javascript
const sampleVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
];
```

### **3. Lorem Picsum Videos**
```javascript
// Generate random video placeholder
const getRandomVideo = (width = 720, height = 1280) => {
  return `https://picsum.photos/${width}/${height}.mp4?random=${Math.random()}`;
};
```

### **4. Your Own Video Upload System**

#### **Using Supabase Storage** (already configured):
```javascript
// Upload video to Supabase
const uploadVideo = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('zippclips')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('zippclips')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
```

---

## 🚀 **QUICK IMPLEMENTATION**

### **Option 1: Add Sample Data Seeder**

Create a file `src/lib/sample-data.ts`:

```typescript
export const sampleZippclips = [
  {
    id: '1',
    description: 'Amazing nature video #nature #beautiful',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    media_type: 'video',
    likes: 245,
    comments: 23,
    saves: 12,
    shares: 8,
    song: 'Nature Sounds',
    song_avatar_url: 'https://picsum.photos/64/64?random=1',
    user_id: 'sample-user-1',
    created_at: new Date().toISOString(),
    profiles: {
      username: 'naturelover',
      full_name: 'Nature Lover',
      avatar_url: 'https://picsum.photos/64/64?random=2'
    }
  },
  {
    id: '2', 
    description: 'Fun adventure video #adventure #fun',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    media_type: 'video',
    likes: 189,
    comments: 45,
    saves: 23,
    shares: 15,
    song: 'Adventure Theme',
    song_avatar_url: 'https://picsum.photos/64/64?random=3',
    user_id: 'sample-user-2',
    created_at: new Date().toISOString(),
    profiles: {
      username: 'adventurer',
      full_name: 'Adventure Seeker',
      avatar_url: 'https://picsum.photos/64/64?random=4'
    }
  }
  // Add more sample videos...
];
```

### **Option 2: Integrate with Free API**

Update your home page to fetch from Pexels:

```typescript
const fetchVideosFromPexels = async () => {
  try {
    const response = await fetch('https://api.pexels.com/videos/search?query=vertical&orientation=portrait&per_page=20', {
      headers: {
        'Authorization': 'YOUR_PEXELS_API_KEY'
      }
    });
    
    const data = await response.json();
    
    const formattedVideos = data.videos.map((video, index) => ({
      id: `pexels-${video.id}`,
      description: `Amazing video #${index + 1}`,
      media_url: video.video_files[0].link,
      media_type: 'video',
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      saves: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 25),
      song: 'Trending Sound',
      song_avatar_url: `https://picsum.photos/64/64?random=${index}`,
      profiles: {
        username: `user${index}`,
        full_name: `Content Creator ${index + 1}`,
        avatar_url: video.user.url || `https://picsum.photos/64/64?random=${index + 100}`
      }
    }));
    
    return formattedVideos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};
```

---

## 📋 **RECOMMENDED APPROACH**

### **For Immediate Testing:**
1. **Use Google Sample Videos** (links provided above) - No API key needed
2. **Add sample data seeder** to populate your database
3. **Test all features** with consistent content

### **For Production:**
1. **User-generated content** via upload system (already implemented)
2. **Licensed content** from APIs like Pexels/Pixabay
3. **Content partnerships** with creators

### **Quick Setup Steps:**
1. Copy the sample video URLs above
2. Insert them into your database via Supabase dashboard
3. Test the complete app functionality
4. Gradually replace with real content

Would you like me to create a database seeder script with sample videos, or help you integrate one of the video APIs?

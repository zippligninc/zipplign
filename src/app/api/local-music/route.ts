import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const musicsDir = path.join(process.cwd(), 'public', 'Musics');
    if (!fs.existsSync(musicsDir)) {
      return NextResponse.json({ tracks: [] });
    }

    const files = fs.readdirSync(musicsDir);
    const mp3s = files.filter((f) => f.toLowerCase().endsWith('.mp3'));

    const tracks = mp3s.map((file, idx) => {
      const name = path.parse(file).name;
      return {
        id: String(idx + 1),
        name,
        artist: 'Local Upload',
        album: 'Local',
        duration: '—',
        preview_url: `/Musics/${file}`,
        image_url: '/Images/logo.png',
        spotify_url: '#'
      };
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    return NextResponse.json({ tracks: [] });
  }
}



import { Channel } from './types';

// Parses an M3U string into a list of Channel objects
export function parseM3U(m3uString: string, sourcePlaylistId: string = 'default'): Channel[] {
  const lines = m3uString.split('\n');
  const channels: Channel[] = [];
  
  let currentChannel: Partial<Channel> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse metadata
      currentChannel = {
        id: Math.random().toString(36).substring(2, 9), // Fallback ID
      };
      
      // Extract properties using regex
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/);
      
      if (tvgIdMatch && tvgIdMatch[1]) {
        currentChannel.id = tvgIdMatch[1];
      }
      if (tvgLogoMatch && tvgLogoMatch[1]) {
        currentChannel.logo = tvgLogoMatch[1];
      } else {
        currentChannel.logo = '';
      }
      
      if (groupTitleMatch && groupTitleMatch[1]) {
        // Split by semicolon usually for multiple categories, take first one or just keep as is
        const categories = groupTitleMatch[1].split(';');
        currentChannel.category = categories[0] || 'Uncategorized';
      } else {
        currentChannel.category = 'Uncategorized';
      }
      
      if (tvgCountryMatch && tvgCountryMatch[1]) {
        currentChannel.country = tvgCountryMatch[1];
      }
      
      // The name is usually after the last comma
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentChannel.name = line.substring(commaIndex + 1).trim();
      } else {
        currentChannel.name = 'Unknown Channel';
      }
      
    } else if (line !== '' && !line.startsWith('#')) {
      // This line is a URL
      if (currentChannel) {
        currentChannel.url = line;
        
        // Only add if URL is valid
        if (currentChannel.url && currentChannel.url.startsWith('http')) {
            channels.push(currentChannel as Channel);
        }
        currentChannel = null;
      }
    }
  }
  
  return channels;
}

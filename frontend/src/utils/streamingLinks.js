export const getStreamingSearchLink = (providerName, title) => {
  const query = encodeURIComponent(title);
  const name = providerName.toLowerCase();

  if (name.includes('netflix')) {
    return `https://www.netflix.com/search?q=${query}`;
  }
  if (name.includes('amazon') || name.includes('prime video')) {
    return `https://www.primevideo.com/search?phrase=${query}`;
  }
  if (name.includes('hotstar') || name.includes('disney')) {
    return `https://www.hotstar.com/in/search?q=${query}`;
  }
  if (name.includes('apple tv')) {
    return `https://tv.apple.com/search/${query}`;
  }
  if (name.includes('google play')) {
    return `https://play.google.com/store/search?q=${query}&c=movies`;
  }
  if (name.includes('zee5')) {
    return `https://www.zee5.com/search?q=${query}`;
  }
  if (name.includes('jio')) {
    return `https://www.jiocinema.com/search/${query}`;
  }
  if (name.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  // Fallback to a general search if provider is unknown
  return `https://www.google.com/search?q=watch+${query}+on+${encodeURIComponent(providerName)}`;
};

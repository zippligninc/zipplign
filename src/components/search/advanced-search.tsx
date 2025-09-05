'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Clock, TrendingUp, Users, Video, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchService, SearchFilters, SearchResult } from '@/lib/search';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AdvancedSearchProps {
  onResultClick?: (result: SearchResult) => void;
  onClose?: () => void;
}

export function AdvancedSearch({ onResultClick, onClose }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'recent',
    timeRange: 'all'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
    loadTrendingSearches();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const loadTrendingSearches = async () => {
    try {
      const trendingData = await SearchService.getTrendingSearches();
      setTrending(trendingData);
    } catch (error) {
      console.error('Error loading trending searches:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestionData = await SearchService.getSearchSuggestions(query);
      setSuggestions(suggestionData);
      setShowSuggestions(suggestionData.length > 0);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const searchResults = await SearchService.search({
        ...filters,
        query: query.trim()
      });
      setResults(searchResults);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const handleTrendingClick = (trend: string) => {
    setQuery(trend);
    handleSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    onClose?.();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'zippclip':
        return <Video className="w-4 h-4" />;
      case 'sound':
        return <Music className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search users, zippclips, sounds..."
            className="border-0 bg-transparent focus-visible:ring-0 text-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-muted')}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-muted/50">
          <div className="space-y-4">
            {/* Search Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'users', label: 'Users' },
                  { value: 'zippclips', label: 'Zippclips' },
                  { value: 'sounds', label: 'Sounds' }
                ].map(type => (
                  <Button
                    key={type.value}
                    variant={filters.type === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, type: type.value as any }))}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <div className="flex gap-2">
                {[
                  { value: 'recent', label: 'Recent', icon: Clock },
                  { value: 'zipping', label: 'Zipping', icon: TrendingUp }
                ].map(sort => (
                  <Button
                    key={sort.value}
                    variant={filters.sortBy === sort.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: sort.value as any }))}
                  >
                    <sort.icon className="w-3 h-3 mr-1" />
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ].map(time => (
                  <Button
                    key={time.value}
                    variant={filters.timeRange === time.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, timeRange: time.value as any }))}
                  >
                    {time.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Searching...</div>
          </div>
        ) : results.length > 0 ? (
          <div className="p-4 space-y-3">
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  {getResultIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.title}</div>
                  {result.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {result.description}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {result.type}
                </Badge>
              </div>
            ))}
          </div>
        ) : showSuggestions ? (
          <div className="p-4">
            <div className="text-sm font-medium mb-3">Suggestions</div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-sm font-medium mb-3">Zipping Searches</div>
            <div className="flex flex-wrap gap-2">
              {trending.map((trend, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleTrendingClick(trend)}
                >
                  {trend}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

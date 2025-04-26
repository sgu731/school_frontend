import { useQuery } from '@tanstack/react-query';

export default function useWiki(title) {
  return useQuery({
    queryKey: ['wiki', title],
    queryFn: async () => {
      if (!title) return null;
      const res = await fetch(`/api/wiki?title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error('Wiki fetch failed');
      return res.json();
    },
    enabled: !!title,
    staleTime: 1000 * 60 * 60,
  });
}

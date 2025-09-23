import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Calendar, Loader2, Search} from 'lucide-react';

interface SimplePost {
  id: number;
  title: string;
  summary?: string;
  authorName: string;
  createdAt: string;
  publishedAt?: string;
  categoryNames: string[];
  isFeatured: boolean;
}


const API_BASE_URL = 'http://localhost:5000/api';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentLang = i18n?.language || 'en';

  useEffect(() => {
    loadData();
  }, [currentLang]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const postsResponse = await fetch(`${API_BASE_URL}/posts?status=1&pageSize=50&languageCode=${currentLang}`);
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        if (postsData.success && postsData.data && postsData.data.data) {
          setPosts(postsData.data.data);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load news data');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };


  const safeFormatDate = (dateString: any) => {
    try {
      if (!dateString) return 'Unknown date';
      return new Date(dateString).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'ru-RU');
    } catch {
      return 'Unknown date';
    }
  };

  const filteredPosts = posts.filter(post => {
      return !searchTerm ||
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center py-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
          {t('home.title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/admin">
              {t('nav.admin')}
            </Link>
          </Button>
        </div>
      </section>
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{t('home.latestNews')}</h2>
          <p className="text-xl text-muted-foreground">
            {currentLang === 'en'
              ? 'Stay updated with the latest news and stories'
              : 'Оставайтесь в курсе последних новостей и историй'
            }
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-6 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={currentLang === 'en' ? 'Search news...' : 'Поиск новостей...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading news...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {!filteredPosts || !Array.isArray(filteredPosts) || filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {currentLang === 'en' ? 'No news found' : 'Новости не найдены'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => {
                  if (!post || !post.id) return null;

                  return (
                    <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {safeFormatDate(post.publishedAt || post.createdAt)}
                          </div>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {post.title || 'No title available'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {post.summary || 'No summary available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline">
                            Read More
                          </Button>
                        </div>
                        {post.isFeatured && (
                          <Badge className="mt-2" variant="default">
                            {currentLang === 'en' ? 'Featured' : 'Рекомендуемое'}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
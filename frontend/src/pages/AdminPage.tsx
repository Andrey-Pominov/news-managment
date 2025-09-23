import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { CreatePostRequest, UpdatePostRequest } from '../types/api';

enum PostStatus {
  Draft = 0,
  Published = 1,
  Archived = 2
}

interface PostListItem {
  id: number;
  slug: string;
  status: PostStatus;
  featuredImageUrl?: string;
  createdAt: string;
  publishedAt?: string;
  viewCount: number;
  isFeatured: boolean;
  title: string;
  summary?: string;
}

interface FormData {
  titleEn: string;
  titleRu: string;
  contentEn: string;
  contentRu: string;
  summary?: string;
  status: PostStatus;
  isFeatured: boolean;
  slug: string;
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<PostListItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    titleEn: '',
    titleRu: '',
    contentEn: '',
    contentRu: '',
    summary: '',
    status: PostStatus.Draft,
    isFeatured: false,
    slug: ''
  });

  useEffect(() => {
    loadData();
  }, [currentLang]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);


      const [postsResponse] = await Promise.all([
        apiService.getPosts({ pageSize: 100, languageCode: currentLang }),
      ]);


      if (postsResponse.success && postsResponse.data) {
        const postsArray = postsResponse.data.items || [];
        setPosts(postsArray);
      } else {
        console.error('Posts response failed:', postsResponse);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titleEn: '',
      titleRu: '',
      contentEn: '',
      contentRu: '',
      summary: '',
      status: PostStatus.Draft,
      isFeatured: false,
      slug: ''
    });
    setEditingPost(null);
    setShowCreateForm(false);
  };

  const handleCreatePost = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEditPost = async (post: PostListItem) => {
    try {
      const response = await apiService.getPost(post.id);
      if (response.success && response.data) {
        const fullPost = response.data;

        const enTranslation = fullPost.translations.find(t => t.languageCode === 'en');
        const ruTranslation = fullPost.translations.find(t => t.languageCode === 'ru');

        setFormData({
          titleEn: enTranslation?.title || '',
          titleRu: ruTranslation?.title || '',
          contentEn: enTranslation?.content || '',
          contentRu: ruTranslation?.content || '',
          summary: enTranslation?.summary || '',
          status: fullPost.status,
          isFeatured: fullPost.isFeatured,
          slug: fullPost.slug
        });

        setEditingPost(post);
        setShowCreateForm(true);
      }
    } catch (err) {
      console.error('Error loading post details:', err);
      setError('Failed to load post details');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSavePost = async () => {
    try {
      setSaving(true);
      setError(null);

      let slug = formData.slug;
      if (!slug) {
        slug = generateSlug(formData.titleEn || formData.titleRu);
      }

      const translations = [
        {
          languageCode: 'en',
          title: formData.titleEn,
          content: formData.contentEn,
          summary: formData.summary || undefined
        },
        {
          languageCode: 'ru',
          title: formData.titleRu,
          content: formData.contentRu,
          summary: formData.summary || undefined
        }
      ].filter(t => t.title && t.content);

      if (translations.length === 0) {
        setError('Please provide at least one complete translation (title and content)');
        return;
      }

      if (editingPost) {
        const updateData: UpdatePostRequest = {
          id: editingPost.id,
          slug,
          status: formData.status,
          isFeatured: formData.isFeatured,
          translations
        };

        const response = await apiService.updatePost(updateData);
        if (response.success) {
          await loadData(); 
          resetForm();
        } else {
          setError(response.message || 'Failed to update post');
        }
      } else {
        const createData: CreatePostRequest = {
          slug,
          status: formData.status,
          isFeatured: formData.isFeatured,
          translations
        };

        const response = await apiService.createPost(createData);
        if (response.success) {
          await loadData(); 
          resetForm();
        } else {
          setError(response.message || 'Failed to create post');
        }
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm(currentLang === 'en' ? 'Are you sure you want to delete this post?' : 'Вы уверены, что хотите удалить этот пост?')) {
      return;
    }

    try {
      const response = await apiService.deletePost(id);
      if (response.success) {
        await loadData(); 
      } else {
        setError(response.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  const handlePublishPost = async (id: number) => {
    try {
      const response = await apiService.publishPost(id);
      if (response.success) {
        await loadData(); 
      } else {
        setError(response.message || 'Failed to publish post');
      }
    } catch (err) {
      console.error('Error publishing post:', err);
      setError('Failed to publish post');
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case PostStatus.Published:
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      case PostStatus.Draft:
        return <Badge variant="secondary"><Edit className="h-3 w-3 mr-1" />Draft</Badge>;
      case PostStatus.Archived:
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading admin panel...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{t('admin.title')}</h1>
        <Button onClick={handleCreatePost} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.createPost')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">{t('admin.posts')}</TabsTrigger>
          <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPost ? t('admin.editPost') : t('admin.createPost')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">English Content</h3>
                    <div>
                      <Label htmlFor="titleEn">Title (English)</Label>
                      <Input
                        id="titleEn"
                        value={formData.titleEn}
                        onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
                        placeholder="Enter English title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="contentEn">Content (English)</Label>
                      <Textarea
                        id="contentEn"
                        value={formData.contentEn}
                        onChange={(e) => setFormData({...formData, contentEn: e.target.value})}
                        placeholder="Enter English content..."
                        rows={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Russian Content</h3>
                    <div>
                      <Label htmlFor="titleRu">Title (Russian)</Label>
                      <Input
                        id="titleRu"
                        value={formData.titleRu}
                        onChange={(e) => setFormData({...formData, titleRu: e.target.value})}
                        placeholder="Введите русский заголовок..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="contentRu">Content (Russian)</Label>
                      <Textarea
                        id="contentRu"
                        value={formData.contentRu}
                        onChange={(e) => setFormData({...formData, contentRu: e.target.value})}
                        placeholder="Введите русский контент..."
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="auto-generated-slug"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status.toString()} onValueChange={(value) => setFormData({...formData, status: parseInt(value) as PostStatus})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PostStatus.Draft.toString()}>Draft</SelectItem>
                        <SelectItem value={PostStatus.Published.toString()}>Published</SelectItem>
                        <SelectItem value={PostStatus.Archived.toString()}>Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSavePost} disabled={saving} className="flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Saving...' : t('admin.save')}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {t('admin.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts found</p>
              </div>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(post.status)}
                          {post.isFeatured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2 mb-2">
                          {post.summary || 'No summary available'}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {post.status === PostStatus.Draft && (
                          <Button size="sm" variant="default" onClick={() => handlePublishPost(post.id)}>
                            Publish
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEditPost(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function NewBlogPost() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/blog?mode=new');
  }, [router]);

  return null;
}

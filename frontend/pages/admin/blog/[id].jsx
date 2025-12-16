import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function EditBlogPost() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/admin/blog?mode=edit&id=${encodeURIComponent(id)}`);
    }
  }, [id, router]);

  return null;
}

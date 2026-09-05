import { redirect } from 'next/navigation';

export default function PublicProductsPage() {
  redirect('/dashboard/products');
}

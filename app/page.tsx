import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login'); // Site açılır açılmaz login sayfasına atar
}
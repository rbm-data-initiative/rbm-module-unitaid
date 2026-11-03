import { redirect } from "next/navigation";

interface HomeProps {
	params: Promise<{ locale: string }>;
}

// The sandbox has a single page: the module under development. The locale
// comes from the route params so no request header is read synchronously.
export default async function Home({ params }: Readonly<HomeProps>) {
	const { locale } = await params;
	redirect(`/${locale}/unitaid`);
}

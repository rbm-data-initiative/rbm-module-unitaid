import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import Shell from "@/ui/shell/Shell";
import { locales } from "@/config";

export const metadata: Metadata = {
	title: "RBM Dashboard Sandbox",
};

interface RootLayoutProps {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Readonly<RootLayoutProps>) {
	const { locale } = await params;
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body>
				<NextIntlClientProvider messages={messages}>
					<Shell>{children}</Shell>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

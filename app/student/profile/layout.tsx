import Header from "@/components/layout/header";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <>{children}</>
    </>
  );
}

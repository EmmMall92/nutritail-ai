type DashboardHeaderProps = {
  title: string;
  description: string;
  userName?: string;
};

export default function DashboardHeader({
  title,
  description,
  userName,
}: DashboardHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-black">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>
      {userName && (
        <p className="mt-2 text-sm text-black">
          Signed in as <span className="font-semibold">{userName}</span>
        </p>
      )}
    </div>
  );
}
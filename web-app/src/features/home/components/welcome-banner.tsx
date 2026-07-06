type WelcomeBannerProps = {
  firstName?: string | null;
};

const getGreeting = (): string => {
  // Server renders per-request; pin to Philippine time so the salutation
  // matches the university's clock regardless of server timezone.
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(new Date()),
  );
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const WelcomeBanner = ({ firstName }: WelcomeBannerProps) => {
  const greeting = getGreeting();

  return (
    <div className="w-full bg-foreground py-8 px-6">
      <h1 className="text-3xl text-background">
        {firstName ? `${greeting}, ${firstName}` : greeting}
      </h1>
      <h2 className="text-background">
        Welcome to PRMSU - Scheduler and Faculty Teaching Load Management
        System.
      </h2>
    </div>
  );
};

export default WelcomeBanner;

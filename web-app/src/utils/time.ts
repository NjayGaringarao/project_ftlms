export const formatDateTime = (input?: string | Date, options?: "short" | "long") => {
  if (!input) return "Not available";

  const date = input instanceof Date ? input : new Date(input);

  if (options === "short") {
    return date.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  }
  return (
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
};

export const formatDate = (input?: string | Date) => {
  if (!input) return "Not available";

  const date = input instanceof Date ? input : new Date(input);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const calculateAge = (birthDate: string | Date) => {
  if (!birthDate) return null;

  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const numberToHourDuration = (hours : number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  const hourPart = wholeHours > 0 ? `${wholeHours}h` : "";
  const minutePart = minutes > 0 ? `${minutes}m` : "";
  return hourPart + (hourPart && minutePart ? " " : "") + minutePart || "0m";
}
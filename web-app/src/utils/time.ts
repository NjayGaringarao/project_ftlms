export const formatDateTime = (input?: string | Date) => {
  if (!input) return "Not available";

  const date = input instanceof Date ? input : new Date(input);

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

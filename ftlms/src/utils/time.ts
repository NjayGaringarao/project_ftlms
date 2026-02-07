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

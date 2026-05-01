export const ADMIN_CREATE_QUERY_VALUE = "1";

export type AdminSearchParams = {
  id?: string | string[];
  new?: string | string[];
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const getAdminPanelQueryState = (searchParams: AdminSearchParams) => {
  const id = firstValue(searchParams.id)?.trim() || null;
  const isCreating = firstValue(searchParams.new) === ADMIN_CREATE_QUERY_VALUE;

  return {
    selectedId: isCreating ? null : id,
    isCreating,
  };
};

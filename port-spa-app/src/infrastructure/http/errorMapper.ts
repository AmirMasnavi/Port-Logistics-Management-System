// Centralized error mapper for HTTP responses / ProblemDetails
// Move backend-specific parsing here so controllers/pages can remain thin.
export const mapServerError = (resp: any): string | null => {
  const data = resp?.response?.data ?? resp?.data ?? resp;
  if (!data) return null;
  if (data.errors && typeof data.errors === 'object') {
    const parts: string[] = [];
    if (data.errors.OrganizationName) parts.push('Please select an existing organization before submitting.');
    if (data.errors.CitizenId) parts.push('The provided Citizen ID is invalid.');
    if (data.errors.RepresentativePhone) parts.push('The phone number is invalid. It must start with 9 and have 9 digits.');
    if (data.errors.RepresentativeEmail) parts.push('The provided email appears invalid.');
    for (const key of Object.keys(data.errors)) {
      if (['OrganizationName','CitizenId','RepresentativePhone','RepresentativeEmail'].includes(key)) continue;
      const val = data.errors[key];
      if (Array.isArray(val)) parts.push(...val.map((v:any) => String(v)));
      else parts.push(String(val));
    }
    if (parts.length) return parts.join(' ');
  }
  if (data.message) return String(data.message);
  if (data.title) return String(data.title);
  try { return typeof data === 'string' ? data : JSON.stringify(data); } catch { return String(data); }
};


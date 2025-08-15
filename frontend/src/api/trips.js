import { api } from "./index";
export const getTrips = (token) => api("/api/trips", { token });
export const createTrip = (token, formData) =>
  api("/api/trips", {
    method: "POST",
    body: formData,
    token,
    isMultipart: true,
  });

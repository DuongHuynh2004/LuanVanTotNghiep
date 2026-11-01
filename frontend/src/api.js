export async function api(path, options = {}) {
  // A login/logout rotates the session token, so read the current token for writes.
  const csrf =
    options.method && options.method !== "GET"
      ? (await api("/csrf")).token
      : null;
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      Object.values(data.errors || {})
        .flat()
        .join(" ") ||
        data.message ||
        "Không thể kết nối. Vui lòng thử lại.",
    );
  }
  return data;
}
export const money = (value) => Number(value).toLocaleString("vi-VN") + " ₫";

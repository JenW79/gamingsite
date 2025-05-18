import Cookies from "js-cookie";

export async function csrfFetch(url, options = {}) {
  options.method = options.method || "GET";
  options.headers = options.headers || {};
  options.credentials = "include"; // Ensure cookies are included

  let token = Cookies.get("XSRF-TOKEN");
  if (!token) {
    const data = await restoreCSRF();
    token = data.csrfToken;
  }

  options.headers["Content-Type"] = "application/json";
  options.headers["XSRF-Token"] = token;
  const res = await fetch(url, options);

  if (res.status >= 400) throw res;
  return res;
}

//  Fetch CSRF token when app loads
export async function restoreCSRF() {
  const res = await fetch("/api/csrf/restore", {
    method: "GET",
    credentials: "include",
  });

  if (res.ok) {
    const data = await res.json();
    Cookies.set("XSRF-TOKEN", data.csrfToken); //  Store the token in cookies
    return data;
  } else {
    throw new Error("Failed to restore CSRF token");
  }
}

import "server-only";

export class ReauthNeeded extends Error {}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    if (data.error === "invalid_grant") throw new ReauthNeeded();
    throw new Error(`Google token error: ${data.error ?? res.status}`);
  }
  return data.access_token as string;
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export async function sendGmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
) {
  const wrapped = Buffer.from(body, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
  const message = [
    `To: ${oneLine(to)}`,
    `Subject: =?UTF-8?B?${Buffer.from(oneLine(subject), "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapped,
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: Buffer.from(message, "utf8").toString("base64url") }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail ${res.status}: ${text.slice(0, 200)}`);
  }
}
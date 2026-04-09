export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato-xi.vercel.app"

  const html = `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 24px; font-family: Inter, sans-serif; background: #f9fafb; }
  </style>
</head>
<body>
  <div id="lead-widget"></div>
  <script src="${appUrl}/widget.js" data-company="${companyId}"></script>
</body>
</html>`

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  })
}

import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
const replacement = `  app.get('/api/stripe/connect', (req, res) => {
    const { userId } = req.query;
    if (!process.env.STRIPE_CLIENT_ID) {
      return res.status(500).send(\`
        <html>
          <head>
            <title>Stripe Configuration Error</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #334155; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              h1 { color: #0f172a; margin-top: 0; }
              p { line-height: 1.5; }
              .code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Stripe Configuration Missing</h1>
              <p>The application could not redirect to Stripe because the <span class="code">STRIPE_CLIENT_ID</span> is not configured.</p>
              <p>To fix this, please add your <strong>Stripe Client ID</strong> to the environment variables / secrets in your deployment or AI Studio dashboard.</p>
              <button onclick="window.history.back()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Go Back</button>
            </div>
          </body>
        </html>
      \`);
    }
    const stripeUrl = \\\`https://connect.stripe.com/oauth/authorize?response_type=code&client_id=\\\${process.env.STRIPE_CLIENT_ID}&scope=read_write&state=\\\${userId}\\\`;
    res.redirect(stripeUrl);
  });`;

code = code.replace(/  app\.get\('\/api\/stripe\/connect', \(req, res\) => \{[\s\S]*?res\.redirect\(stripeUrl\);\n  \}\);/, replacement);
fs.writeFileSync('server.ts', code);

import app from "../server";

export default function apiHandler(req: any, res: any) {
  try {
    return app(req, res, (err: any) => {
      if (err) {
        console.error("[Vercel API Error]:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
        }
      } else {
        if (!res.headersSent) {
          res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.url}` });
        }
      }
    });
  } catch (uncaught: any) {
    console.error("[Vercel API Uncaught]:", uncaught);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: uncaught.message || "Unhandled Server Error" });
    }
  }
}

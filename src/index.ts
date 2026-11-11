import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import chatRoutes from "./routes/chat";
import userRoutes from "./routes/user";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/chat", chatRoutes);
app.use("/user", userRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

import express from "express";
import path, { dirname } from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import morgan from "morgan";
import cors from "cors";
import { setupSwagger } from "./swaggerConfig.js";
import winstonLogger from "./utils/logger.js";
import indexRouter from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";
import slotsRoutes from "./routes/slots.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const morganFormat = process.env.NODE_ENV === "production" ? "dev" : "combined";
app.use(morgan(morganFormat, { stream: winstonLogger.stream }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cors());
app.use((req, res, next) => {
  const io = app.get("io");
  if (io) req.io = io;
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/auth", authRoutes);
app.use("/api", slotsRoutes);
app.use("/api/appointment", appointmentRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

setupSwagger(app);

export default app;

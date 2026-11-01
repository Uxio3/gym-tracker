import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { exercisesRouter } from "./modules/exercises/exercises.routes.js";
import { routinesRouter } from "./modules/routines/routines.routes.js";
import { workoutsRouter } from "./modules/workouts/workouts.routes.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello World");
});

app.use("/auth", authRouter);
app.use("/exercises", exercisesRouter);
app.use("/routines", routinesRouter);
app.use("/workouts", workoutsRouter);

app.use(errorHandler);
